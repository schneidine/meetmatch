from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.core.management import call_command
from django.test import TestCase, override_settings

from users.models import Interest
from users.views import DEFAULT_INTEREST_NAMES

from .models import Event


User = get_user_model()


class EventSeedTests(TestCase):
    def test_seed_events_command_creates_sample_events(self):
        self.assertEqual(Event.objects.count(), 0)

        call_command('seed_events')

        self.assertGreaterEqual(Event.objects.count(), 4)
        self.assertTrue(Event.objects.filter(name='Live Music Night').exists())
        self.assertTrue(Event.objects.filter(name='Coffee Meetup').exists())

    @override_settings(ENABLE_SAMPLE_EVENT_FALLBACK=True)
    def test_events_endpoint_returns_seeded_events(self):
        call_command('seed_events')

        response = self.client.get('/api/events/')

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn('events', payload)
        self.assertGreaterEqual(len(payload['events']), 4)
        self.assertEqual(payload['events'][0]['source'], 'manual')

    @override_settings(ENABLE_SAMPLE_EVENT_FALLBACK=True)
    def test_events_endpoint_includes_mobile_and_external_fields(self):
        call_command('seed_events')

        response = self.client.get('/api/events/')

        self.assertEqual(response.status_code, 200)
        first_event = response.json()['events'][0]
        self.assertIn('eventbrite_id', first_event)
        self.assertIn('category_names', first_event)
        self.assertIn('creator_username', first_event)
        self.assertIn('latitude', first_event)
        self.assertIn('longitude', first_event)

    @override_settings(ENABLE_SAMPLE_EVENT_FALLBACK=False, EVENTBRITE_API_KEY='')
    def test_events_endpoint_can_disable_sample_fallback(self):
        response = self.client.get('/api/events/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['events'], [])
        self.assertIn('sync_warning', response.json())

    def test_events_are_ranked_by_interest_and_location_for_user(self):
        call_command('seed_events')

        tech = Interest.objects.get(name='Technology')
        entrepreneurship = Interest.objects.get(name='Entrepreneurship')
        music = Interest.objects.get(name='Music')

        user = User.objects.create_user(
            username='eventmatcher',
            email='eventmatcher@example.com',
            password='secret123',
            age=27,
            location=Point(-81.3904, 28.5515),
            radius=10,
        )
        user.interests.set([tech, entrepreneurship, music])
        user.top_interests.set([tech, entrepreneurship])

        response = self.client.get(f'/api/events/?user_id={user.id}&radius=10')

        self.assertEqual(response.status_code, 200)
        first_event = response.json()['events'][0]
        self.assertEqual(first_event['name'], 'Startup Makers Meetup')

    def test_toggle_event_interest_updates_count(self):
        call_command('seed_events')
        user = User.objects.create_user(
            username='eventfan',
            email='eventfan@example.com',
            password='secret123',
            age=26,
        )
        event = Event.objects.first()

        response = self.client.post(
            f'/api/events/{event.id}/interest/',
            data='{"user_id": %d}' % user.id,
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload['is_interested'])
        self.assertEqual(payload['interested_count'], 1)

        second_response = self.client.post(
            f'/api/events/{event.id}/interest/',
            data='{"user_id": %d}' % user.id,
            content_type='application/json',
        )

        self.assertEqual(second_response.status_code, 200)
        second_payload = second_response.json()
        self.assertFalse(second_payload['is_interested'])
        self.assertEqual(second_payload['interested_count'], 0)

    def test_seeded_events_cover_all_default_interests(self):
        call_command('seed_events')

        covered_interests = set()
        for event in Event.objects.prefetch_related('categories'):
            covered_interests.update(event.categories.values_list('name', flat=True))

        self.assertTrue(set(DEFAULT_INTEREST_NAMES).issubset(covered_interests))
