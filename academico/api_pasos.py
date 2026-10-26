from rest_framework import serializers, viewsets, permissions
from .models import Paso


class PasoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paso
        fields = ['id', 'tarea', 'titulo', 'completado', 'orden', 'horas_estimadas']
        read_only_fields = ['orden']

    def validate_tarea(self, tarea):
        # Solo se puede agregar un paso a una tarea propia
        if tarea.asignatura.usuario != self.context['request'].user:
            raise serializers.ValidationError('Esa tarea no existe.')
        return tarea


class PasoViewSet(viewsets.ModelViewSet):
    serializer_class = PasoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        pasos = Paso.objects.filter(tarea__asignatura__usuario=self.request.user)
        tarea_id = self.request.query_params.get('tarea')
        if tarea_id:
            pasos = pasos.filter(tarea_id=tarea_id)
        return pasos

    def perform_create(self, serializer):
        # El nuevo paso va al final de la lista
        tarea = serializer.validated_data['tarea']
        serializer.save(orden=tarea.pasos.count())