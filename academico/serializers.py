from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.validators import MinValueValidator, MaxValueValidator
from .models import Perfil, Asignatura, Tarea, Alerta


class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ['id', 'usuario', 'carrera', 'semestre']
        read_only_fields = ['usuario']


class AsignaturaSerializer(serializers.ModelSerializer):
    creditos = serializers.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])

    class Meta:
        model = Asignatura
        fields = ['id', 'usuario', 'nombre', 'creditos', 'color']
        read_only_fields = ['usuario']

    def validate_nombre(self, valor):
        valor = valor.strip()
        if len(valor) < 2:
            raise serializers.ValidationError('El nombre debe tener al menos 2 caracteres.')
        return valor

    def validate_color(self, valor):
        import re
        if not re.fullmatch(r'#[0-9A-Fa-f]{6}', valor):
            raise serializers.ValidationError('El color debe ser un hexadecimal válido, ej: #4F46E5.')
        return valor


class TareaSerializer(serializers.ModelSerializer):
    # Mostramos el nombre de la asignatura además de su id, para que el
    # frontend no tenga que hacer una consulta extra solo para mostrarlo.
    asignatura_nombre = serializers.CharField(source='asignatura.nombre', read_only=True)
    asignatura_color = serializers.CharField(source='asignatura.color', read_only=True)

    horas_estimadas = serializers.DecimalField(
        max_digits=4, decimal_places=1,
        validators=[
            MinValueValidator(0.1, message='Las horas estimadas deben ser mayores a 0.'),
            MaxValueValidator(60, message='Las horas estimadas no pueden superar 60 (revisa si es una sola tarea o deberías dividirla en varias).'),
        ],
    )
    # El modelo usa TextField (sin límite) para permitir descripciones
    # largas, pero sin tope alguien podría mandar textos gigantes y
    # saturar la base de datos. Le ponemos un límite razonable aquí.
    descripcion = serializers.CharField(max_length=2000, required=False, allow_blank=True)

    class Meta:
        model = Tarea
        fields = [
            'id', 'asignatura', 'asignatura_nombre', 'asignatura_color',
            'titulo', 'descripcion', 'fecha_entrega', 'dificultad',
            'estado', 'horas_estimadas', 'nivel_criticidad',
            'creado_en', 'actualizado_en',
        ]
        read_only_fields = ['nivel_criticidad']  # se calcula solo, nadie lo edita a mano

    def validate_titulo(self, valor):
        valor = valor.strip()
        if len(valor) < 3:
            raise serializers.ValidationError('El título debe tener al menos 3 caracteres.')
        return valor

    def validate_descripcion(self, valor):
        return valor.strip()

    def validate_asignatura(self, asignatura):
        # Evita que un usuario cree/edite una tarea apuntando a una
        # asignatura que no es suya (IDOR).
        request = self.context.get('request')
        if request and asignatura.usuario != request.user:
            raise serializers.ValidationError('Esta asignatura no te pertenece.')
        return asignatura

    def validate_fecha_entrega(self, fecha):
        from django.utils import timezone
        if self.instance is None and fecha < timezone.now():
            raise serializers.ValidationError('La fecha de entrega no puede estar en el pasado.')
        return fecha


class AlertaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alerta
        fields = ['id', 'tarea', 'tipo', 'mensaje', 'fecha_disparo', 'enviada', 'creado_en']

    def validate_mensaje(self, valor):
        valor = valor.strip()
        if len(valor) < 3:
            raise serializers.ValidationError('El mensaje debe tener al menos 3 caracteres.')
        return valor

    def validate_tarea(self, tarea):
        # Evita que un usuario cree/edite una alerta apuntando a una
        # tarea que no es suya (IDOR).
        request = self.context.get('request')
        if request and tarea.asignatura.usuario != request.user:
            raise serializers.ValidationError('Esta tarea no te pertenece.')
        return tarea



class RegistroSerializer(serializers.Serializer):
    """
    No está atado a un solo modelo (por eso usamos Serializer normal,
    no ModelSerializer) porque crea DOS cosas a la vez: un User de
    Django y su Perfil asociado.
    """
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    nombre = serializers.CharField(max_length=100)
    email = serializers.EmailField(required=False, allow_blank=True)
    carrera = serializers.CharField(max_length=100, default='Ingeniería de Sistemas')
    semestre = serializers.IntegerField(default=1, min_value=1, max_value=12)

    def validate_username(self, valor):
        valor = valor.strip()
        if len(valor) < 3:
            raise serializers.ValidationError('El usuario debe tener al menos 3 caracteres.')
        if User.objects.filter(username=valor).exists():
            raise serializers.ValidationError('Ese nombre de usuario ya está en uso.')
        return valor

    def validate_nombre(self, valor):
        valor = valor.strip()
        if len(valor) < 2:
            raise serializers.ValidationError('El nombre debe tener al menos 2 caracteres.')
        return valor

    def validate_carrera(self, valor):
        valor = valor.strip()
        if len(valor) < 2:
            raise serializers.ValidationError('La carrera debe tener al menos 2 caracteres.')
        return valor

    def create(self, datos_validados):
        usuario = User.objects.create_user(
            username=datos_validados['username'],
            password=datos_validados['password'],
            email=datos_validados.get('email', ''),
            first_name=datos_validados['nombre'],
        )
        Perfil.objects.create(
            usuario=usuario,
            carrera=datos_validados['carrera'],
            semestre=datos_validados['semestre'],
        )
        return usuario


class LoginConNombreView:
    """Marcador — la lógica real vive en views.py, este comentario es solo referencia."""