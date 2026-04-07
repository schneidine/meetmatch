from django.core.management.base import BaseCommand

from events.sample_data import seed_sample_events


class Command(BaseCommand):
    help = "Seed the database with sample MeetMatch events"

    def handle(self, *args, **options):
        events = seed_sample_events()
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(events)} sample events."))
