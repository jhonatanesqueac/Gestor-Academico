from django.core.management.base import BaseCommand
from academico.logica_alertas import ejecutar_revision_completa


class Command(BaseCommand):
    help = 'Revisa las tareas activas y genera alertas de urgencia y cuellos de botella.'

    def handle(self, *args, **options):
        resultado = ejecutar_revision_completa()

        self.stdout.write(self.style.SUCCESS(
            f"Revisión completa: {resultado['urgencia']} alerta(s) de urgencia, "
            f"{resultado['cuellos_de_botella']} alerta(s) de cuello de botella."
        ))