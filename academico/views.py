import logging
import re
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import TokenError
from .models import Perfil, Asignatura, Tarea, Alerta
from .logica_alertas import ejecutar_revision_completa
from .serializers import (
    PerfilSerializer, AsignaturaSerializer, TareaSerializer, AlertaSerializer,
    RegistroSerializer, SolicitarResetSerializer, ConfirmarResetSerializer,
)

logger = logging.getLogger('seguridad')


def obtener_ip_cliente(request):
    # X-Forwarded-For es el header que usan los proxys (Railway, etc.)
    # para indicar la IP real del usuario, ya que sin esto veríamos
    # siempre la IP interna del proxy en vez de la del cliente real.
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def origen_es_valido(request):
    """
    Defensa extra para los endpoints que leen la cookie httpOnly del
    refresh token. En producción esa cookie usa SameSite=None (hace
    falta para viajar entre el dominio del frontend en Vercel y el del
    backend en Railway), lo que significa que el navegador la adjunta
    incluso en peticiones iniciadas por OTRO sitio. CORS ya evita que
    ese sitio ajeno pueda LEER la respuesta, pero esto rechaza la
    petición desde el inicio si el origen no es uno de los nuestros.
    """
    origen = request.META.get('HTTP_ORIGIN')
    if not origen:
        # Sin header Origin (mismo origen en navegadores más viejos, o
        # un cliente que no es navegador) se deja pasar — el riesgo
        # real es un navegador operando desde un sitio ajeno, y ese
        # caso SIEMPRE manda el header Origin.
        return True
    if origen in settings.CORS_ALLOWED_ORIGINS:
        return True
    for patron in getattr(settings, 'CORS_ALLOWED_ORIGIN_REGEXES', []):
        if re.match(patron, origen):
            return True
    return False


def set_refresh_cookie(response, refresh_token):
    max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=str(refresh_token),
        max_age=max_age,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path='/api/auth/',  # solo se manda en rutas de auth, no en toda la API
    )


class AsignaturaViewSet(viewsets.ModelViewSet):
    serializer_class = AsignaturaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Cada usuario solo ve SUS propias asignaturas
        return Asignatura.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class TareaViewSet(viewsets.ModelViewSet):
    serializer_class = TareaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Solo las tareas de las asignaturas del usuario logueado.
        # Ya vienen ordenadas por nivel_criticidad gracias al Meta.ordering del modelo.
        return Tarea.objects.filter(asignatura__usuario=self.request.user)


class AlertaViewSet(viewsets.ModelViewSet):
    serializer_class = AlertaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Sin leer primero, y lo más reciente arriba
        return (
            Alerta.objects.filter(tarea__asignatura__usuario=self.request.user)
            .order_by('enviada', '-creado_en')
        )

    def list(self, request, *args, **kwargs):
        # Antes de responder, revisa las tareas de ESTA persona y genera
        # las alertas que falten: el sistema se vuelve proactivo sin
        # depender de que alguien corra un comando a mano.
        ejecutar_revision_completa(request.user)
        return super().list(request, *args, **kwargs)


class PerfilViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Perfil.objects.filter(usuario=self.request.user)



from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator


@method_decorator(ratelimit(key='ip', rate='5/m', block=True), name='post')
class RegistroView(generics.CreateAPIView):
    """
    Vista pública (cualquiera puede registrarse, no hace falta estar
    logueado) que crea el usuario y le entrega un token de una vez,
    para que React lo pueda loguear automáticamente sin pedirle que
    inicie sesión de nuevo justo después de registrarse.
    """
    serializer_class = RegistroSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()
        logger.info(
            'Usuario nuevo registrado: %s (IP: %s)',
            usuario.username, obtener_ip_cliente(request),
        )
        refresh = RefreshToken.for_user(usuario)
        response = Response(
            {
                'access': str(refresh.access_token),
                'username': usuario.username,
                'nombre': usuario.first_name,
            },
            status=201,
        )
        set_refresh_cookie(response, refresh)
        return response


@method_decorator(ratelimit(key='ip', rate='5/m', block=True), name='post')
class LoginView(generics.GenericAPIView):
    """
    Reemplaza al obtain_auth_token por defecto de DRF para poder
    devolver, además del token, el nombre del estudiante —
    así React puede saludarlo sin hacer una segunda petición.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        ip = obtener_ip_cliente(request)
        usuario = authenticate(request=request, username=username, password=password)

        if usuario is None:
            logger.warning(
                'Login fallido para usuario "%s" (IP: %s)',
                username, ip,
            )
            return Response({'detail': 'Usuario o contraseña incorrectos.'}, status=400)

        logger.info(
            'Login exitoso: %s (IP: %s)',
            usuario.username, ip,
        )
        refresh = RefreshToken.for_user(usuario)
        response = Response({
            'access': str(refresh.access_token),
            'username': usuario.username,
            'nombre': usuario.first_name,
        })
        set_refresh_cookie(response, refresh)
        return response


class LogoutView(generics.GenericAPIView):
    """
    Invalida el refresh token del lado del servidor (lo mete a la
    blacklist), para que aunque alguien lo haya robado antes del
    logout, no lo pueda seguir usando para sacar nuevos access tokens.
    También borra la cookie httpOnly donde vivía.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)

        response = Response(status=status.HTTP_205_RESET_CONTENT)
        response.delete_cookie(settings.REFRESH_COOKIE_NAME, path='/api/auth/')

        if not refresh_token:
            # No había cookie (ej. ya se había cerrado sesión antes) —
            # igual respondemos 205 para que el frontend limpie su
            # estado local sin problema.
            return response

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            logger.warning(
                'Intento de logout con token inválido/expirado: %s (IP: %s)',
                request.user.username, obtener_ip_cliente(request),
            )
            return response

        logger.info(
            'Logout: %s (IP: %s)',
            request.user.username, obtener_ip_cliente(request),
        )
        return response


class RefreshView(generics.GenericAPIView):
    """
    Reemplaza al TokenRefreshView por defecto de simplejwt: en vez de
    leer el refresh token del body del request, lo lee de la cookie
    httpOnly. Con ROTATE_REFRESH_TOKENS=True, cada renovación genera
    un refresh nuevo, así que también actualizamos la cookie.
    """
    permission_classes = [permissions.AllowAny]
    # Se llama automáticamente en cada carga de página (silent
    # refresh) y solo funciona con una cookie httpOnly válida, que
    # nadie puede adivinar por fuerza bruta -- el throttle general de
    # anónimos (pensado para proteger login/registro) es innecesario
    # aquí y terminaría bloqueando sesiones legítimas.
    throttle_classes = []

    def post(self, request, *args, **kwargs):
        if not origen_es_valido(request):
            return Response({'detail': 'Origen no permitido.'}, status=status.HTTP_403_FORBIDDEN)

        refresh_token = request.COOKIES.get(settings.REFRESH_COOKIE_NAME)
        if not refresh_token:
            return Response({'detail': 'No hay sesión activa.'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError:
            return Response(
                {'detail': 'Sesión expirada, inicia sesión de nuevo.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        datos = serializer.validated_data
        response = Response({'access': datos['access']})

        nuevo_refresh = datos.get('refresh')
        if nuevo_refresh:
            set_refresh_cookie(response, nuevo_refresh)

        return response


@method_decorator(ratelimit(key='ip', rate='5/m', block=True), name='post')
class SolicitarResetPasswordView(generics.GenericAPIView):
    """
    Recibe un email y, SI existe un usuario con ese correo, le manda un
    link con un token de un solo uso para restablecer su contraseña.
    Responde el mismo mensaje genérico exista o no el correo, para que
    este endpoint no sirva para adivinar qué correos están registrados.
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = SolicitarResetSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        ip = obtener_ip_cliente(request)

        usuario = User.objects.filter(email__iexact=email).first()
        if usuario and usuario.email:
            uid = urlsafe_base64_encode(force_bytes(usuario.pk))
            token = default_token_generator.make_token(usuario)
            link = f'{settings.FRONTEND_URL}/restablecer-password/{uid}/{token}/'
            send_mail(
                subject='Restablece tu contraseña - Gestor Académico',
                message=(
                    f'Hola {usuario.first_name or usuario.username},\n\n'
                    f'Haz clic en el siguiente enlace para restablecer tu contraseña:\n{link}\n\n'
                    'Si no solicitaste esto, ignora este correo.'
                ),
                from_email=None,
                recipient_list=[usuario.email],
            )
            logger.info('Solicitud de reset de contraseña: %s (IP: %s)', usuario.username, ip)
        else:
            logger.info('Solicitud de reset para correo no registrado: %s (IP: %s)', email, ip)

        return Response({
            'detail': 'Si el correo está registrado, te llegará un enlace para restablecer tu contraseña.',
        })


class ConfirmarResetPasswordView(generics.GenericAPIView):
    """
    Valida el token del link recibido por correo y, si es válido,
    cambia la contraseña. El token es de un solo uso (Django invalida
    automáticamente el token viejo apenas la contraseña cambia).
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = ConfirmarResetSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        datos = serializer.validated_data
        ip = obtener_ip_cliente(request)

        try:
            uid = force_str(urlsafe_base64_decode(datos['uidb64']))
            usuario = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            usuario = None

        if usuario is None or not default_token_generator.check_token(usuario, datos['token']):
            logger.warning('Intento de reset de contraseña con token inválido (IP: %s)', ip)
            return Response(
                {'detail': 'El enlace no es válido o ya expiró.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario.set_password(datos['nueva_password'])
        usuario.save()
        logger.info('Contraseña restablecida: %s (IP: %s)', usuario.username, ip)
        return Response({'detail': 'Contraseña actualizada correctamente.'})