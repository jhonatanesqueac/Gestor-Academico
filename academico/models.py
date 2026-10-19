from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime


class Perfil(models.Model):
    """Extiende el usuario de Django con datos propios de un estudiante."""
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    carrera = models.CharField(max_length=100, default='Ingeniería de Sistemas')
    semestre = models.PositiveSmallIntegerField(default=1)
    institucion = models.CharField(max_length=150, blank=True)
    telefono = models.CharField(max_length=30, blank=True)
    bio = models.TextField(max_length=300, blank=True)
    color_avatar = models.CharField(max_length=7, default='#5B7065')
    institucion = models.CharField(max_length=150, blank=True, default='')
    telefono = models.CharField(max_length=20, blank=True, default='')
    # blank=True/null=True a nivel de modelo para no romper las cuentas
    # que ya existen sin este dato (admin, estudiante1, etc.) -- el
    # RegistroSerializer es quien exige este campo para cuentas NUEVAS.
    documento_identidad = models.CharField(
        max_length=20, blank=True, null=True, unique=True,
    )

    def __str__(self):
        return f"Perfil de {self.usuario.username}"


class Asignatura(models.Model):
    """Una materia que el estudiante está cursando."""
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='asignaturas')
    nombre = models.CharField(max_length=150)
    creditos = models.PositiveSmallIntegerField()
    color = models.CharField(max_length=7, default='#4F46E5')  # para el dashboard, formato hex

    def __str__(self):
        return f"{self.nombre} ({self.creditos} créditos)"


class Tarea(models.Model):
    """Una entrega o tarea pendiente asociada a una asignatura."""

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EN_PROCESO = 'EN_PROCESO', 'En proceso'
        TERMINADO = 'TERMINADO', 'Terminado'

    class Dificultad(models.IntegerChoices):
        MUY_FACIL = 1, 'Muy fácil'
        FACIL = 2, 'Fácil'
        MEDIA = 3, 'Media'
        DIFICIL = 4, 'Difícil'
        MUY_DIFICIL = 5, 'Muy difícil'

    asignatura = models.ForeignKey(Asignatura, on_delete=models.CASCADE, related_name='tareas')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    fecha_entrega = models.DateTimeField()
    dificultad = models.PositiveSmallIntegerField(choices=Dificultad.choices, default=Dificultad.MEDIA)
    estado = models.CharField(max_length=15, choices=Estado.choices, default=Estado.PENDIENTE)
    horas_estimadas = models.DecimalField(max_digits=4, decimal_places=1, default=2.0)

    # Campo calculado automáticamente por el algoritmo de priorización
    nivel_criticidad = models.FloatField(default=0)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-nivel_criticidad']  # por defecto, la más crítica primero

    def calcular_criticidad(self):
        """
        Calcula el nivel de criticidad (0-100) cruzando tres variables:
        - Urgencia (50%): entre menos días falten, más crítico.
        - Créditos de la asignatura (25%): entre más créditos, más crítico.
        - Dificultad (25%): entre más difícil, más crítico.
        """
        ahora = timezone.now()
        dias_restantes = (self.fecha_entrega - ahora).total_seconds() / 86400  # 86400 seg = 1 día

        # --- 1. Urgencia ---
        # Si ya venció o vence hoy -> 100 (máxima criticidad).
        # Si faltan 30 días o más -> se acerca a 0.
        # Entre esos dos puntos, decrece de forma lineal.
        DIAS_LIMITE = 30
        if dias_restantes <= 0:
            urgencia = 100
        elif dias_restantes >= DIAS_LIMITE:
            urgencia = 0
        else:
            urgencia = 100 * (1 - (dias_restantes / DIAS_LIMITE))

        # --- 2. Créditos normalizados ---
        # Asumimos que ninguna asignatura supera los 6 créditos.
        CREDITOS_MAX = 6
        creditos_norm = min(self.asignatura.creditos / CREDITOS_MAX, 1) * 100

        # --- 3. Dificultad normalizada ---
        # La dificultad ya viene en escala 1-5.
        DIFICULTAD_MAX = 5
        dificultad_norm = (self.dificultad / DIFICULTAD_MAX) * 100

        # --- Combinación ponderada ---
        criticidad = (urgencia * 0.50) + (creditos_norm * 0.25) + (dificultad_norm * 0.25)

        return round(criticidad, 2)

    def save(self, *args, **kwargs):
        # Recalcula la criticidad automáticamente cada vez que se guarda la tarea
        self.nivel_criticidad = self.calcular_criticidad()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.titulo


class Alerta(models.Model):
    """Notificación automática relacionada a una tarea próxima a vencer."""

    class Tipo(models.TextChoices):
        RECORDATORIO = 'RECORDATORIO', 'Recordatorio simple'
        CUELLO_BOTELLA = 'CUELLO_BOTELLA', 'Cuello de botella detectado'
        URGENTE = 'URGENTE', 'Entrega urgente'
        VENCIDA = 'VENCIDA', 'Tarea vencida sin marcar'

    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE, related_name='alertas')
    tipo = models.CharField(max_length=20, choices=Tipo.choices, default=Tipo.RECORDATORIO)
    mensaje = models.CharField(max_length=255)
    fecha_disparo = models.DateTimeField()
    enviada = models.BooleanField(default=False)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.tipo}] {self.mensaje[:40]}"
