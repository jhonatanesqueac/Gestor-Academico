from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    AsignaturaViewSet, TareaViewSet, AlertaViewSet, PerfilViewSet,
    RegistroView, LoginView, LogoutView, RefreshView,
    SolicitarResetPasswordView, ConfirmarResetPasswordView,
)

router = DefaultRouter()
router.register(r'asignaturas', AsignaturaViewSet, basename='asignatura')
router.register(r'tareas', TareaViewSet, basename='tarea')
router.register(r'alertas', AlertaViewSet, basename='alerta')
router.register(r'perfiles', PerfilViewSet, basename='perfil')

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='api-login'),
    path('auth/registro/', RegistroView.as_view(), name='api-registro'),
    path('auth/refresh/', RefreshView.as_view(), name='api-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='api-logout'),
    path('auth/password/reset/', SolicitarResetPasswordView.as_view(), name='api-password-reset'),
    path('auth/password/reset/confirmar/', ConfirmarResetPasswordView.as_view(), name='api-password-reset-confirmar'),
] + router.urls