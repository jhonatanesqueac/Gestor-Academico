from django.contrib.auth import authenticate
from rest_framework import viewsets, permissions, generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import Perfil, Asignatura, Tarea, Alerta
from .serializers import (
    PerfilSerializer, AsignaturaSerializer, TareaSerializer, AlertaSerializer, RegistroSerializer,
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
        return Alerta.objects.filter(tarea__asignatura__usuario=self.request.user)


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
        refresh = RefreshToken.for_user(usuario)
        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'username': usuario.username,
                'nombre': usuario.first_name,
            },
            status=201,
        )


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
        usuario = authenticate(username=username, password=password)

        if usuario is None:
            return Response({'detail': 'Usuario o contraseña incorrectos.'}, status=400)

        refresh = RefreshToken.for_user(usuario)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': usuario.username,
            'nombre': usuario.first_name,
        })


class LogoutView(generics.GenericAPIView):
    """
    Invalida el refresh token del lado del servidor (lo mete a la
    blacklist), para que aunque alguien lo haya robado antes del
    logout, no lo pueda seguir usando para sacar nuevos access tokens.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Falta el refresh token.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'detail': 'Token inválido o ya expirado.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_205_RESET_CONTENT)