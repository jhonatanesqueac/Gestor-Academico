from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from twilio.rest import Client
from .models import Tarea, Alerta


# Umbrales configurables: a partir de cuántos días antes se dispara cada tipo de alerta
DIAS_RECORDATORIO = 3   # avisa 3 días antes
DIAS_URGENTE = 1        # avisa 1 día antes (o menos) con tono más fuerte
MIN_TAREAS_CUELLO_BOTELLA = 3   # si hay 3 o más entregas juntas...
VENTANA_CUELLO_BOTELLA_DIAS = 4  # ...dentro de 4 días, es un cuello de botella


def generar_alertas_de_urgencia():
    """
    Revisa las tareas pendientes o en proceso. Si están a punto de vencer
    y todavía no se les generó una alerta de ese tipo, crea una nueva.
    """
    ahora = timezone.now()
    tareas_activas = Tarea.objects.exclude(estado=Tarea.Estado.TERMINADO)
    alertas_creadas = []

    for tarea in tareas_activas:
        dias_restantes = (tarea.fecha_entrega - ahora).days

        if dias_restantes < 0:
            continue  # ya venció, no tiene sentido alertar por adelantado

        # Decidimos qué tipo de alerta corresponde según cuán cerca está la entrega
        if dias_restantes <= DIAS_URGENTE:
            tipo = Alerta.Tipo.URGENTE
            mensaje = f'"{tarea.titulo}" vence muy pronto (en {dias_restantes} día(s) o menos).'
        elif dias_restantes <= DIAS_RECORDATORIO:
            tipo = Alerta.Tipo.RECORDATORIO
            mensaje = f'"{tarea.titulo}" vence en {dias_restantes} día(s).'
        else:
            continue  # todavía falta mucho, no generamos alerta aún

        # Evitamos duplicar: si ya existe una alerta de este tipo para esta
        # tarea, no creamos otra igual cada vez que corre el comando.
        ya_existe = Alerta.objects.filter(tarea=tarea, tipo=tipo).exists()
        if ya_existe:
            continue

        alerta = Alerta.objects.create(
            tarea=tarea,
            tipo=tipo,
            mensaje=mensaje,
            fecha_disparo=ahora,
        )
        alertas_creadas.append(alerta)

    return alertas_creadas


def detectar_cuellos_de_botella():
    """
    Agrupa las tareas activas por estudiante. Si un estudiante tiene
    varias tareas venciendo en una ventana corta de días, genera UNA
    alerta especial avisando del cuello de botella (en vez de una
    alerta separada por cada tarea, que sería repetitivo).
    """
    ahora = timezone.now()
    limite = ahora + timedelta(days=VENTANA_CUELLO_BOTELLA_DIAS)

    tareas_proximas = Tarea.objects.exclude(estado=Tarea.Estado.TERMINADO).filter(
        fecha_entrega__gte=ahora,
        fecha_entrega__lte=limite,
    ).select_related('asignatura__usuario')

    # Agrupamos manualmente por usuario, ya que una tarea no tiene el
    # usuario directo, sino a través de su asignatura.
    tareas_por_usuario = {}
    for tarea in tareas_proximas:
        usuario_id = tarea.asignatura.usuario_id
        tareas_por_usuario.setdefault(usuario_id, []).append(tarea)

    alertas_creadas = []

    for usuario_id, tareas_del_usuario in tareas_por_usuario.items():
        if len(tareas_del_usuario) < MIN_TAREAS_CUELLO_BOTELLA:
            continue  # no es suficiente para considerarlo un cuello de botella

        # Usamos la tarea más próxima a vencer como "ancla" de la alerta,
        # para no crear una alerta de cuello de botella duplicada cada
        # vez que corre el comando mientras las mismas tareas siguen activas.
        tarea_ancla = min(tareas_del_usuario, key=lambda t: t.fecha_entrega)

        ya_existe = Alerta.objects.filter(
            tarea=tarea_ancla, tipo=Alerta.Tipo.CUELLO_BOTELLA
        ).exists()
        if ya_existe:
            continue

        titulos = ', '.join(t.titulo for t in tareas_del_usuario)
        mensaje = (
            f'Tienes {len(tareas_del_usuario)} entregas en los próximos '
            f'{VENTANA_CUELLO_BOTELLA_DIAS} días: {titulos}.'
        )

        alerta = Alerta.objects.create(
            tarea=tarea_ancla,
            tipo=Alerta.Tipo.CUELLO_BOTELLA,
            mensaje=mensaje,
            fecha_disparo=ahora,
        )
        alertas_creadas.append(alerta)

    return alertas_creadas


def ejecutar_revision_completa():
    """Punto de entrada único que corre ambas revisiones."""
    urgencia = generar_alertas_de_urgencia()
    cuellos = detectar_cuellos_de_botella()
    return {
        'urgencia': len(urgencia),
        'cuellos_de_botella': len(cuellos),
    }


def _enviar_correo(destinatario, alerta):
    send_mail(
        subject=f"[StudyFlow] {alerta.get_tipo_display()}",
        message=alerta.mensaje,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[destinatario],
        using='default',
        fail_silently=False,
    )


def _enviar_whatsapp(numero, alerta):
    # numero debe estar en formato E.164, ej: +573001234567
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(
        from_=f'whatsapp:{settings.TWILIO_WHATSAPP_FROM}',
        to=f'whatsapp:{numero}',
        body=alerta.mensaje,
    )


def enviar_alertas_pendientes():
    """
    Recorre las alertas generadas que todavía no se han enviado,
    manda correo y/o WhatsApp según los datos disponibles del usuario,
    y marca como enviadas las que lograron al menos un canal exitoso.
    """
    pendientes = Alerta.objects.filter(enviada=False).select_related(
        'tarea__asignatura__usuario__perfil'
    )
    enviadas, fallidas = [], []

    for alerta in pendientes:
        usuario = alerta.tarea.asignatura.usuario
        perfil = getattr(usuario, 'perfil', None)
        algun_canal_ok = False

        if usuario.email:
            try:
                _enviar_correo(usuario.email, alerta)
                algun_canal_ok = True
            except Exception as e:
                fallidas.append((alerta, 'correo', str(e)))

        if perfil and perfil.telefono:
            try:
                _enviar_whatsapp(perfil.telefono, alerta)
                algun_canal_ok = True
            except Exception as e:
                fallidas.append((alerta, 'whatsapp', str(e)))

        if algun_canal_ok:
            alerta.enviada = True
            alerta.save(update_fields=['enviada'])
            enviadas.append(alerta)

    return {'enviadas': len(enviadas), 'fallidas': fallidas}