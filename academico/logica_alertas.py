from datetime import timedelta
from django.utils import timezone
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