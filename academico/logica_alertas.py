from datetime import timedelta
from django.utils import timezone
from .models import Tarea, Alerta


# Umbrales configurables
HORAS_RECORDATORIO = 72          # avisa desde 3 días antes
HORAS_URGENTE = 24               # el último día, con tono más fuerte
MIN_TAREAS_CUELLO_BOTELLA = 3    # 3 o más entregas juntas...
VENTANA_CUELLO_BOTELLA_DIAS = 4  # ...dentro de 4 días = cuello de botella


def _tareas_activas(usuario=None):
    """Tareas sin terminar. Si se pasa un usuario, solo las suyas."""
    tareas = Tarea.objects.exclude(estado=Tarea.Estado.TERMINADO).select_related('asignatura')
    if usuario is not None:
        tareas = tareas.filter(asignatura__usuario=usuario)
    return tareas


def _texto_plazo(horas):
    if horas < 1:
        return 'en menos de una hora'
    if horas < 24:
        h = int(horas)
        return f'en {h} hora' + ('' if h == 1 else 's')
    d = int(horas // 24)
    return f'en {d} día' + ('' if d == 1 else 's')


def _fin_del_dia(fecha):
    """23:59:59 del día de entrega, en hora local (igual que el Tablero)."""
    local = timezone.localtime(fecha)
    return local.replace(hour=23, minute=59, second=59, microsecond=999999)


def _crear_si_no_existe(tarea, tipo, mensaje):
    """Una sola alerta por tarea y tipo, aunque la revisión corra mil veces."""
    alerta, creada = Alerta.objects.get_or_create(
        tarea=tarea,
        tipo=tipo,
        defaults={'mensaje': mensaje, 'fecha_disparo': timezone.now()},
    )
    return alerta if creada else None


def marcar_alertas_obsoletas(usuario=None):
    """Si la tarea ya se terminó, su alerta pendiente deja de tener sentido."""
    alertas = Alerta.objects.filter(enviada=False, tarea__estado=Tarea.Estado.TERMINADO)
    if usuario is not None:
        alertas = alertas.filter(tarea__asignatura__usuario=usuario)
    return alertas.update(enviada=True)


def generar_alertas_de_urgencia(usuario=None):
    ahora = timezone.now()
    creadas = []

    for tarea in _tareas_activas(usuario):
        horas = (tarea.fecha_entrega - ahora).total_seconds() / 3600
        if horas < 0:
            continue  # ya pasó la hora de entrega; eso lo cubre "vencida"

        if horas <= HORAS_URGENTE:
            tipo = Alerta.Tipo.URGENTE
        elif horas <= HORAS_RECORDATORIO:
            tipo = Alerta.Tipo.RECORDATORIO
        else:
            continue

        alerta = _crear_si_no_existe(tarea, tipo, f'"{tarea.titulo}" vence {_texto_plazo(horas)}.')
        if alerta:
            creadas.append(alerta)

    return creadas


def detectar_cuellos_de_botella(usuario=None):
    """Varias entregas juntas = UNA sola alerta combinada por estudiante."""
    ahora = timezone.now()
    limite = ahora + timedelta(days=VENTANA_CUELLO_BOTELLA_DIAS)
    proximas = _tareas_activas(usuario).filter(fecha_entrega__gte=ahora, fecha_entrega__lte=limite)

    por_usuario = {}
    for tarea in proximas:
        por_usuario.setdefault(tarea.asignatura.usuario_id, []).append(tarea)

    creadas = []
    for tareas_del_usuario in por_usuario.values():
        if len(tareas_del_usuario) < MIN_TAREAS_CUELLO_BOTELLA:
            continue

        # La tarea más próxima sirve de "ancla" para no repetir la alerta
        ancla = min(tareas_del_usuario, key=lambda t: t.fecha_entrega)
        titulos = ', '.join(t.titulo for t in tareas_del_usuario)
        mensaje = (
            f'Tienes {len(tareas_del_usuario)} entregas en los próximos '
            f'{VENTANA_CUELLO_BOTELLA_DIAS} días: {titulos}.'
        )

        alerta = _crear_si_no_existe(ancla, Alerta.Tipo.CUELLO_BOTELLA, mensaje)
        if alerta:
            creadas.append(alerta)

    return creadas


def generar_alertas_de_vencidas(usuario=None):
    """Misma regla que el Tablero: vencida = terminó su día sin marcarse."""
    ahora = timezone.now()
    creadas = []

    for tarea in _tareas_activas(usuario).filter(fecha_entrega__lt=ahora):
        if _fin_del_dia(tarea.fecha_entrega) >= ahora:
            continue  # todavía es el día de la entrega

        mensaje = f'"{tarea.titulo}" venció sin marcarse como terminada. Revísala en Historial.'
        alerta = _crear_si_no_existe(tarea, Alerta.Tipo.VENCIDA, mensaje)
        if alerta:
            creadas.append(alerta)

    return creadas


def ejecutar_revision_completa(usuario=None):
    """Sin usuario revisa a todos (comando manual); con usuario, solo a esa persona."""
    obsoletas = marcar_alertas_obsoletas(usuario)
    urgencia = generar_alertas_de_urgencia(usuario)
    cuellos = detectar_cuellos_de_botella(usuario)
    vencidas = generar_alertas_de_vencidas(usuario)
    return {
        'urgencia': len(urgencia),
        'cuellos_de_botella': len(cuellos),
        'vencidas': len(vencidas),
        'obsoletas': obsoletas,
    }