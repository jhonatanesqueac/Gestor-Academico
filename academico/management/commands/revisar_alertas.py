from django.core.management.base import BaseCommand
from academico.logica_alertas import ejecutar_revision_completa, enviar_alertas_pendientes


class Command(BaseCommand):
    help = 'Revisa tareas próximas a vencer, genera alertas y las envía por correo/WhatsApp.'

    def handle(self, *args, **options):
        resumen = ejecutar_revision_completa()
        self.stdout.write(self.style.SUCCESS(
            f"Generadas — urgencia: {resumen['urgencia']}, "
            f"cuellos de botella: {resumen['cuellos_de_botella']}"
        ))

        envio = enviar_alertas_pendientes()
        self.stdout.write(self.style.SUCCESS(f"Enviadas: {envio['enviadas']}"))

        if envio['fallidas']:
            self.stdout.write(self.style.WARNING(f"{len(envio['fallidas'])} fallaron:"))
            for alerta, canal, error in envio['fallidas']:
                self.stdout.write(f"  - Alerta #{alerta.id} ({canal}): {error}")