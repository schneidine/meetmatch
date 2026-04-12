# events/services.py
import os
import requests
from django.utils import timezone
from django.contrib.gis.geos import Point

from .models import Event

TICKETMASTER_API_KEY = os.environ.get('TICKETMASTER_API_KEY', '')
EVENTBRITE_TOKEN = os.environ.get('EVENTBRITE_TOKEN', '')

TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json'
EVENTBRITE_BASE_URL = 'https://www.eventbriteapi.com/v3/events/search/'


def sync_ticketmaster_events(city=None, keyword=None, size=20):
    """
    Fetch events from Ticketmaster Discovery API and upsert them into the DB.
    Returns (created_count, updated_count, errors).
    Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
    """
    if not TICKETMASTER_API_KEY:
        raise ValueError('TICKETMASTER_API_KEY is not set in environment variables.')

    params = {
        'apikey': TICKETMASTER_API_KEY,
        'size': size,
        'sort': 'date,asc',
    }
    if city:
        params['city'] = city
    if keyword:
        params['keyword'] = keyword

    response = requests.get(TICKETMASTER_BASE_URL, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    events_raw = data.get('_embedded', {}).get('events', [])
    created = updated = 0
    errors = []

    for raw in events_raw:
        try:
            tm_id = raw.get('id')
            name = raw.get('name', '')
            description = raw.get('info', '') or raw.get('description', '') or ''

            # Date/time
            dates = raw.get('dates', {}).get('start', {})
            date_str = dates.get('dateTime')
            if not date_str:
                date_str = dates.get('localDate', '') + 'T00:00:00Z'
            from django.utils.dateparse import parse_datetime
            date_time = parse_datetime(date_str)

            # Location from first venue
            location = None
            venues = raw.get('_embedded', {}).get('venues', [])
            if venues:
                lat = venues[0].get('location', {}).get('latitude')
                lng = venues[0].get('location', {}).get('longitude')
                if lat and lng:
                    location = Point(float(lng), float(lat), srid=4326)

            _, created_flag = Event.objects.update_or_create(
                ticketmaster_id=tm_id,
                defaults={
                    'name': name,
                    'description': description,
                    'date_time': date_time,
                    'location': location,
                    'source': 'ticketmaster',
                    'external_data': raw,
                    'last_synced': timezone.now(),
                    # creator is required by the model — handled at the view level
                },
            )
            if created_flag:
                created += 1
            else:
                updated += 1
        except Exception as e:
            errors.append({'id': raw.get('id'), 'error': str(e)})

    return created, updated, errors


def sync_eventbrite_events(location_address=None, keyword=None, size=20):
    """
    Fetch events from Eventbrite API and upsert them into the DB.
    Returns (created_count, updated_count, errors).
    Docs: https://www.eventbrite.com/platform/api#/reference/event/search/
    """
    if not EVENTBRITE_TOKEN:
        raise ValueError('EVENTBRITE_TOKEN is not set in environment variables.')

    headers = {'Authorization': f'Bearer {EVENTBRITE_TOKEN}'}
    params = {
        'page_size': size,
        'expand': 'venue',
    }
    if location_address:
        params['location.address'] = location_address
        params['location.within'] = '50km'
    if keyword:
        params['q'] = keyword

    response = requests.get(EVENTBRITE_BASE_URL, headers=headers, params=params, timeout=10)
    response.raise_for_status()
    data = response.json()

    events_raw = data.get('events', [])
    created = updated = 0
    errors = []

    for raw in events_raw:
        try:
            eb_id = raw.get('id')
            name = raw.get('name', {}).get('text', '')
            description = raw.get('description', {}).get('text', '') or ''

            from django.utils.dateparse import parse_datetime
            date_time = parse_datetime(raw.get('start', {}).get('utc', ''))

            # Location from venue
            location = None
            venue = raw.get('venue')
            if venue:
                lat = venue.get('latitude')
                lng = venue.get('longitude')
                if lat and lng:
                    location = Point(float(lng), float(lat), srid=4326)

            _, created_flag = Event.objects.update_or_create(
                eventbrite_id=eb_id,
                defaults={
                    'name': name,
                    'description': description,
                    'date_time': date_time,
                    'location': location,
                    'source': 'eventbrite',
                    'external_data': raw,
                    'last_synced': timezone.now(),
                },
            )
            if created_flag:
                created += 1
            else:
                updated += 1
        except Exception as e:
            errors.append({'id': raw.get('id'), 'error': str(e)})

    return created, updated, errors
