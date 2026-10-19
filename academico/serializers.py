from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.validators import MinValueValidator, MaxValueValidator
from .models import Perfil, Asignatura, Tarea, Alerta


class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ['id', 'usuario', 'carrera', 'semestre', 'institucion', 'telefono', 'documento_identidad']
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
    email = serializers.EmailField()
    carrera = serializers.CharField(max_length=100, default='Ingeniería de Sistemas')
    semestre = serializers.IntegerField(default=1, min_value=1, max_value=12)
    institucion = serializers.CharField(max_length=150)
    telefono = serializers.CharField(max_length=20)
    documento_identidad = serializers.CharField(max_length=20)

    def validate_username(self, valor):
        valor = valor.strip()
        if len(valor) < 3:
            raise serializers.ValidationError('El usuario debe tener al menos 3 caracteres.')
        if User.objects.filter(username=valor).exists():
            raise serializers.ValidationError('Ese nombre de usuario ya está en uso.')
        return valor

    def validate_email(self, valor):
        if User.objects.filter(email__iexact=valor).exists():
            raise serializers.ValidationError('Ya existe una cuenta con ese correo.')
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

    def validate_institucion(self, valor):
        valor = valor.strip()
        if len(valor) < 2:
            raise serializers.ValidationError('La institución debe tener al menos 2 caracteres.')
        return valor

    def validate_telefono(self, valor):
        import re
        valor = valor.strip()
        if not re.fullmatch(r'[\d\s+()-]{7,20}', valor):
            raise serializers.ValidationError('Ingresa un número de teléfono válido.')
        return valor

    def validate_documento_identidad(self, valor):
        valor = valor.strip()
        if not valor.isdigit():
            raise serializers.ValidationError('El documento debe contener solo números.')
        if len(valor) < 5:
            raise serializers.ValidationError('El documento debe tener al menos 5 dígitos.')
        if Perfil.objects.filter(documento_identidad=valor).exists():
            raise serializers.ValidationError('Ya existe una cuenta registrada con ese documento.')
        return valor

    def create(self, datos_validados):
        usuario = User.objects.create_user(
            username=datos_validados['username'],
            password=datos_validados['password'],
            email=datos_validados['email'],
            first_name=datos_validados['nombre'],
        )
        Perfil.objects.create(
            usuario=usuario,
            carrera=datos_validados['carrera'],
            semestre=datos_validados['semestre'],
            institucion=datos_validados['institucion'],
            telefono=datos_validados['telefono'],
            documento_identidad=datos_validados['documento_identidad'],
        )
        return usuario


class SolicitarResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ConfirmarResetSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    nueva_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirmar_password = serializers.CharField(write_only=True)

    def validate(self, datos):
        if datos['nueva_password'] != datos['confirmar_password']:
            raise serializers.ValidationError({'confirmar_password': 'Las contraseñas no coinciden.'})
        return datos


class LoginConNombreView:
    """Marcador — la lógica real vive en views.py, este comentario es solo referencia."""



class MiPerfilSerializer(serializers.ModelSerializer):
    """
    Junta dos tablas en un solo objeto para el frontend: los datos del User
    de Django (nombre, correo) y los del Perfil (carrera, semestre, etc.).
    """
    username = serializers.CharField(source='usuario.username', read_only=True)
    fecha_registro = serializers.DateTimeField(source='usuario.date_joined', read_only=True)
    nombre = serializers.CharField(source='usuario.first_name', max_length=150)
    apellido = serializers.CharField(source='usuario.last_name', max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(source='usuario.email', required=False, allow_blank=True)
    semestre = serializers.IntegerField(min_value=1, max_value=12, required=False)
    color_avatar = serializers.RegexField(
        r'^#[0-9a-fA-F]{6}$',
        required=False,
        error_messages={'invalid': 'El color debe tener el formato #RRGGBB.'},
    )

    class Meta:
        model = Perfil
        fields = [
            'username', 'fecha_registro', 'nombre', 'apellido', 'email',
            'carrera', 'semestre', 'institucion', 'telefono', 'bio', 'color_avatar',
        ]

    def update(self, instance, validated_data):
        # Los campos con "source='usuario.xxx'" pertenecen al User, no al Perfil:
        # los separamos y los guardamos en su propia tabla.
        datos_usuario = validated_data.pop('usuario', {})
        usuario = instance.usuario
        for campo, valor in datos_usuario.items():
            setattr(usuario, campo, valor)
        usuario.save()
        return super().update(instance, validated_data)


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    password_nueva = serializers.CharField(write_only=True)

    def validate_password_actual(self, valor):
        if not self.context['request'].user.check_password(valor):
            raise serializers.ValidationError('La contraseña actual no es correcta.')
        return valor

    def validate_password_nueva(self, valor):
        # Mismas reglas de seguridad que el registro (largo, muy común, solo números...)
        validate_password(valor, self.context['request'].user)
        return valor

    def validate(self, datos):
        if datos['password_actual'] == datos['password_nueva']:
            raise serializers.ValidationError(
                {'password_nueva': 'La nueva contraseña debe ser distinta a la actual.'}
            )
        return datos