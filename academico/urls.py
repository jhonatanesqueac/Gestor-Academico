from django.urls import path
from rest_framework.routers import DefaultRouter
from .api_pasos import PasoViewSet
from .api_ia import AnalizarTareaView, ConfirmarPropuestaView
from .views import (
    AsignaturaViewSet, TareaViewSet, AlertaViewSet,
    RegistroView, LoginView, LogoutView, RefreshView,
    SolicitarResetPasswordView, ConfirmarResetPasswordView,
    MiPerfilView, CambiarPasswordView,
)

router = DefaultRouter()
router.register(r'asignaturas', AsignaturaViewSet, basename='asignatura')
router.register(r'tareas', TareaViewSet, basename='tarea')
router.register(r'alertas', AlertaViewSet, basename='alerta')
router.register(r'pasos', PasoViewSet, basename='paso')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/registro/', RegistroView.as_view(), name='api-registro'),
    path('auth/refresh/', RefreshView.as_view(), name='api-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='api-logout'),
    path('auth/password/reset/', SolicitarResetPasswordView.as_view(), name='api-password-reset'),
    path('auth/password/reset/confirmar/', ConfirmarResetPasswordView.as_view(), name='api-password-reset-confirmar'),
    path('perfil/', MiPerfilView.as_view(), name='api-perfil'),
    path('perfil/cambiar-password/', CambiarPasswordView.as_view(), name='api-cambiar-password'),
    path('ia/analizar/', AnalizarTareaView.as_view(), name='api-ia-analizar'),
    path('ia/confirmar/', ConfirmarPropuestaView.as_view(), name='api-ia-confirmar'),
] + router.urls