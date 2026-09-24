from django.contrib import admin
from .models import Perfil, Asignatura, Tarea, Alerta


@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'carrera', 'semestre')


@admin.register(Asignatura)
class AsignaturaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'creditos', 'usuario')
    list_filter = ('usuario',)


@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'asignatura', 'fecha_entrega', 'dificultad', 'estado', 'nivel_criticidad')
    list_filter = ('estado', 'asignatura')
    ordering = ('-nivel_criticidad',)


@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ('tarea', 'tipo', 'fecha_disparo', 'enviada')
    list_filter = ('tipo', 'enviada')
