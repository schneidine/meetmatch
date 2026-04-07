from django.core.management import call_command
from django.test import TestCase

from users.views import DEFAULT_INTEREST_NAMES

from .models import Event


class EventSeedTests(TestCase):
    def test_seed_events_command_creates_sample_events(self):
        self.assertEqual(Event.objects.count(), 0)

        call_command('seed_events')

        self.assertGreaterEqual(Event.objects.count(), 4)
        self.assertTrue(Event.objects.filter(name='Live Music Night').exists())
        self.assertTrue(Event.objects.filter(name='Coffee Meetup').exists())

    def test_events_endpoint_returns_seeded_events(self):
        response = self.client.get('/api/events/')

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn('events', payload)
        self.assertGreaterEqual(len(payload['events']), 4)
        self.assertEqual(payload['events'][0]['source'], 'manual')

    def test_seeded_events_cover_all_default_interests(self):
        call_command('seed_events')

        covered_interests = set()
        for event in Event.objects.prefetch_related('categories'):
            covered_interests.update(event.categories.values_list('name', flat=True))

        self.assertTrue(set(DEFAULT_INTEREST_NAMES).issubset(covered_interests))
