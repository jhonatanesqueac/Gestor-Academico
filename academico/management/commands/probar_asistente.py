import json

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from academico.api_ia import analizar_tarea
from academico.ia import IAError


class Command(BaseCommand):
    help = 'Prueba el asistente con un texto. Gasta 1 solicitud de tu cuota gratuita de Gemini por cada ejecución.'

    def add_arguments(self, parser):
        parser.add_argument('usuario', help='Nombre de usuario con el que se prueba (usa sus materias)')
        parser.add_argument('texto', help='Descripción de la tarea, entre comillas')
        parser.add_argument(
            '--respuesta', action='append', default=[],
            help='Respuesta a una pregunta previa, con el formato "pregunta|respuesta". Se puede repetir.',
        )

    def handle(self, *args, **options):
        try:
            usuario = User.objects.get(username=options['usuario'])
        except User.DoesNotExist:
            raise CommandError('No existe ese usuario.')

        respuestas = []
        for r in options['respuesta']:
            pregunta, _, respuesta = r.partition('|')
            respuestas.append({'pregunta': pregunta.strip(), 'respuesta': respuesta.strip()})

        try:
            resultado = analizar_tarea(usuario, options['texto'], respuestas)
        except IAError as error:
            self.stdout.write(self.style.ERROR(f'[{error.codigo}] {error.mensaje}'))
            if error.detalle:
                self.stdout.write(f'Detalle técnico: {error.detalle}')
            return

        self.stdout.write(json.dumps(resultado, ensure_ascii=False, indent=2))