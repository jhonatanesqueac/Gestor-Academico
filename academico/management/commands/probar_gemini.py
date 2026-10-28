from django.core.management.base import BaseCommand
from academico.ia import pedir_json, ia_disponible, modelos_configurados, IAError


class Command(BaseCommand):
    help = 'Prueba la conexión con Gemini usando una sola solicitud.'

    def handle(self, *args, **options):
        if not ia_disponible():
            self.stdout.write(self.style.ERROR('Falta GEMINI_API_KEY en tu archivo .env (y reinicia el servidor).'))
            return

        self.stdout.write(f'Modelos configurados: {", ".join(modelos_configurados())}')

        try:
            datos, modelo = pedir_json(
                'Responde únicamente con un JSON válido.',
                'Devuelve un JSON con dos campos: "saludo" (un saludo corto en español) y "suma" (el resultado de 2 + 3).',
            )
        except IAError as error:
            self.stdout.write(self.style.ERROR(f'[{error.codigo}] {error.mensaje}'))
            if error.detalle:
                self.stdout.write(f'Detalle técnico: {error.detalle}')
            return

        self.stdout.write(self.style.SUCCESS(f'Respondió {modelo}: {datos}'))