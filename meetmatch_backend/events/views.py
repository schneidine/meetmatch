import json
import re
from datetime import datetime, time, timedelta
import logging

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django.views.decorators.csrf import csrf_exempt

from users.models import Interest

from .models import Event
from .sample_data import seed_sample_events
from .serializers import EventSerializer

try:
    from django.contrib.gis.db.models.functions import Distance
    from django.contrib.gis.geos import Point
except Exception:  # pragma: no cover - only for non-GIS environments
    Distance = None
    Point = None

logger = logging.getLogger(__name__)

EVENT_INTEREST_KEYWORDS = {
    'Music': ['music', 'concert', 'band', 'dj', 'salsa'],
    'Coffee': ['coffee', 'cafe', 'espresso', 'latte'],
    'Food': ['food', 'brunch', 'dinner', 'lunch', 'restaurant'],
    'Board Games': ['board game', 'tabletop'],
    'Gaming': ['gaming', 'esports', 'video game'],
    'Hiking': ['hike', 'trail', 'walk'],
    'Fitness': ['fitness', 'workout', 'gym'],
    'Movies': ['movie', 'film', 'cinema'],
    'Reading': ['book', 'reading', 'author'],
    'Yoga': ['yoga'],
    'Running': ['run', 'running', '5k'],
    'Photography': ['photo', 'photography'],
    'Art': ['art', 'gallery', 'paint'],
    'Dancing': ['dance', 'dancing', 'salsa'],
    'Technology': ['tech', 'technology', 'software', 'ai'],
    'Entrepreneurship': ['startup', 'founder', 'entrepreneur'],
    'Fashion': ['fashion', 'style', 'thrift'],
    'Sports': ['sport', 'sports'],
    'Basketball': ['basketball'],
    'Soccer': ['soccer', 'football'],
    'Volunteering': ['volunteer', 'charity', 'community'],
    'Pets': ['pet', 'dog', 'cat', 'animal'],
    'Travel': ['travel', 'trip', 'explore'],
    'Cooking': ['cooking', 'cook', 'kitchen'],
}

EVENT_INTEREST_WEIGHT = 0.4
EVENT_LOCATION_WEIGHT = 0.6
EVENT_SHARED_INTEREST_WEIGHT = 0.35
EVENT_SHARED_TOP_INTEREST_WEIGHT = 0.65
EVENTBRITE_WEB_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; MeetMatch/1.0)',
}


def _cors_json_response(payload, status=200):
    response = JsonResponse(payload, status=status)
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type'
    return response


def _get_default_creator():
    user_model = get_user_model()
    organizer, created = user_model.objects.get_or_create(
        email='organizer@meetmatch.local',
        defaults={
            'username': 'meetmatch_organizer',
            'first_name': 'MeetMatch',
            'last_name': 'Team',
            'age': 28,
        },
    )
    if created:
        organizer.set_password('demo-password-123')
        organizer.save(update_fields=['password'])
    return organizer


def _infer_interest_names(name, description):
    search_text = f'{name} {description}'.lower()
    matched_names = []

    for interest_name, keywords in EVENT_INTEREST_KEYWORDS.items():
        if any(keyword in search_text for keyword in keywords):
            matched_names.append(interest_name)

    return matched_names[:5]


def _assign_categories(event_obj, name, description):
    interest_names = _infer_interest_names(name, description)
    if not interest_names:
        return

    categories = [Interest.objects.get_or_create(name=interest_name)[0] for interest_name in interest_names]
    event_obj.categories.set(categories)


def _interest_name_map(user, field_name):
    return {interest.id: interest.name for interest in getattr(user, field_name).all()}


def _normalized_overlap(left_ids, right_ids):
    left_set = set(left_ids)
    right_set = set(right_ids)
    if not left_set or not right_set:
        return 0.0

    return len(left_set & right_set) / max(len(left_set), len(right_set))


def _coerce_positive_float(value, default):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default

    return number if number > 0 else default


def _score_event_interest_alignment(user, event_obj):
    user_interests = _interest_name_map(user, 'interests')
    user_top_interests = _interest_name_map(user, 'top_interests')
    event_categories = {interest.id: interest.name for interest in event_obj.categories.all()}

    shared_interest_ids = set(user_interests) & set(event_categories)
    shared_top_ids = set(user_top_interests) & set(event_categories)

    shared_interest_ratio = _normalized_overlap(user_interests, event_categories)
    shared_top_ratio = _normalized_overlap(user_top_interests, event_categories)

    interest_score = round(
        (
            (shared_interest_ratio * EVENT_SHARED_INTEREST_WEIGHT)
            + (shared_top_ratio * EVENT_SHARED_TOP_INTEREST_WEIGHT)
        )
        * 100
    )

    return (
        interest_score,
        sorted(user_interests[interest_id] for interest_id in shared_interest_ids),
        sorted(user_top_interests[interest_id] for interest_id in shared_top_ids),
    )


def _distance_miles_for_event(user, event_obj):
    distance = getattr(event_obj, 'distance', None)
    if distance is not None:
        try:
            return round(distance.mi, 1)
        except (AttributeError, TypeError, ValueError):
            pass

    if not getattr(user, 'location', None):
        return None

    if hasattr(event_obj, 'location') and event_obj.location:
        user_lat = user.location.y
        user_lng = user.location.x
        event_lat = event_obj.location.y
        event_lng = event_obj.location.x
    else:
        event_lat = getattr(event_obj, 'latitude', None)
        event_lng = getattr(event_obj, 'longitude', None)
        if event_lat is None or event_lng is None:
            return None
        user_lat = user.location.y
        user_lng = user.location.x

    miles_per_lat_degree = 69.0
    miles_per_lng_degree = 54.6
    lat_miles = (event_lat - user_lat) * miles_per_lat_degree
    lng_miles = (event_lng - user_lng) * miles_per_lng_degree
    return round((lat_miles ** 2 + lng_miles ** 2) ** 0.5, 1)


def _score_event_location_compatibility(distance_miles, preferred_radius):
    if distance_miles is None:
        return 50
    if distance_miles <= preferred_radius:
        return 100
    if distance_miles <= preferred_radius * 1.5:
        return 75
    if distance_miles <= preferred_radius * 2:
        return 40
    return 0



def _rank_events_for_user(events, user, preferred_radius):
    ranked_events = []
    for event_obj in events:
        interest_score, shared_category_names, shared_top_category_names = _score_event_interest_alignment(user, event_obj)
        distance_miles = _distance_miles_for_event(user, event_obj)
        location_score = _score_event_location_compatibility(distance_miles, preferred_radius)

        event_obj.event_match_score = round(
            (interest_score * EVENT_INTEREST_WEIGHT) + (location_score * EVENT_LOCATION_WEIGHT)
        )
        event_obj.event_interest_score = interest_score
        event_obj.event_location_score = location_score
        event_obj.shared_category_names = shared_category_names
        event_obj.shared_top_category_names = shared_top_category_names
        event_obj.distance_miles = distance_miles
        ranked_events.append(event_obj)

    ranked_events.sort(
        key=lambda event_obj: (
            -getattr(event_obj, 'event_match_score', 0),
            getattr(event_obj, 'distance_miles', None) or 9999,
            -len(getattr(event_obj, 'shared_top_category_names', [])),
            -getattr(event_obj, 'event_interest_score', 0),
            event_obj.date_time,
        )
    )
    return ranked_events


def _build_eventbrite_listing_url(search_location):
    parts = [part.strip() for part in search_location.split(',') if part.strip()]
    if len(parts) >= 2:
        city_slug = re.sub(r'[^a-z0-9]+', '-', parts[0].lower()).strip('-')
        region_slug = re.sub(r'[^a-z0-9]+', '-', parts[1].lower()).strip('-')
        return f'https://www.eventbrite.com/d/{region_slug}--{city_slug}/events/'

    location_slug = re.sub(r'[^a-z0-9]+', '-', search_location.lower()).strip('-')
    return f'https://www.eventbrite.com/d/{location_slug}/events/'


def _parse_eventbrite_start(value):
    if not value:
        return timezone.now()

    parsed_datetime = parse_datetime(value)
    if parsed_datetime:
        return parsed_datetime if timezone.is_aware(parsed_datetime) else timezone.make_aware(parsed_datetime)

    parsed_date = parse_date(value)
    if parsed_date:
        return timezone.make_aware(datetime.combine(parsed_date, time(hour=12)))

    return timezone.now()


def _upsert_eventbrite_event(event_id, name, description, date_time, external_data, latitude=None, longitude=None):
    creator = _get_default_creator()
    safe_event_id = str(event_id)[:100]
    safe_name = (name or 'Untitled Event')[:100]
    defaults = {
        'name': safe_name,
        'description': description,
        'date_time': date_time,
        'creator': creator,
        'source': 'eventbrite',
        'external_data': external_data,
        'last_synced': timezone.now(),
    }

    if latitude is not None and longitude is not None:
        try:
            lat_value = float(latitude)
            lng_value = float(longitude)
            if Point is not None and hasattr(Event, 'location'):
                defaults['location'] = Point(x=lng_value, y=lat_value, srid=4326)
            else:
                if hasattr(Event, 'latitude'):
                    defaults['latitude'] = lat_value
                if hasattr(Event, 'longitude'):
                    defaults['longitude'] = lng_value
        except (TypeError, ValueError):
            logger.debug('Skipping invalid venue coordinates for event %s', event_id)

    event_obj, _created = Event.objects.update_or_create(
        eventbrite_id=safe_event_id,
        defaults=defaults,
    )
    _assign_categories(event_obj, safe_name, description)
    return event_obj


def _sync_eventbrite_web_events(search_location):
    page_url = _build_eventbrite_listing_url(search_location)

    try:
        response = requests.get(page_url, headers=EVENTBRITE_WEB_HEADERS, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as exc:
        logger.warning('Eventbrite web listing request failed: %s', exc)
        return [], 'Eventbrite public listings are unavailable right now; showing saved/sample events instead.'

    match = re.search(r'<script\s+type="application/ld\+json">\s*(\{.*?\})\s*</script>', response.text, re.S)
    if not match:
        logger.warning('Could not find parsable Eventbrite listing JSON for %s', page_url)
        return [], 'Eventbrite public listings could not be parsed right now; showing saved/sample events instead.'

    try:
        listing_data = json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        logger.warning('Failed to parse Eventbrite listing JSON: %s', exc)
        return [], 'Eventbrite public listings could not be parsed right now; showing saved/sample events instead.'

    saved_events = []
    for entry in listing_data.get('itemListElement', []):
        event_data = entry.get('item', {})
        event_url = event_data.get('url', '')
        event_id_match = re.search(r'tickets-(\d+)', event_url)
        fallback_key = event_url or event_data.get('name') or f'event-{entry.get("position", len(saved_events) + 1)}'
        event_id = event_id_match.group(1) if event_id_match else re.sub(r'[^a-zA-Z0-9]+', '-', fallback_key).strip('-')[:100]
        if not event_id:
            continue

        name = event_data.get('name') or 'Untitled Event'
        description = event_data.get('description') or ''
        date_time = _parse_eventbrite_start(event_data.get('startDate'))
        geo_data = event_data.get('location', {}).get('geo', {})
        latitude = geo_data.get('latitude')
        longitude = geo_data.get('longitude')

        event_obj = _upsert_eventbrite_event(
            event_id=event_id,
            name=name,
            description=description,
            date_time=date_time,
            external_data=event_data,
            latitude=latitude,
            longitude=longitude,
        )
        saved_events.append(event_obj)

    if saved_events:
        return saved_events, 'Using Eventbrite public listing fallback while direct API search is unavailable.'

    return [], 'No Eventbrite public events were found for that location right now.'


def _sync_eventbrite_events(search_location, search_radius):
    api_key = getattr(settings, 'EVENTBRITE_API_KEY', '')
    if not api_key:
        return [], None

    try:
        response = requests.get(
            'https://www.eventbriteapi.com/v3/events/search/',
            headers={'Authorization': f'Bearer {api_key}'},
            params={
                'location.address': search_location,
                'location.within': f'{search_radius}mi',
                'expand': 'venue',
            },
            timeout=10,
        )
        response.raise_for_status()
    except requests.exceptions.Timeout:
        logger.warning('Eventbrite API request timed out; trying public listing fallback.')
        return _sync_eventbrite_web_events(search_location)
    except requests.exceptions.RequestException as exc:
        logger.warning('Eventbrite API request failed: %s', exc)
        return _sync_eventbrite_web_events(search_location)

    saved_events = []
    for event_data in response.json().get('events', []):
        event_id = event_data.get('id')
        if not event_id:
            continue

        name = event_data.get('name', {}).get('text') or 'Untitled Event'
        description = event_data.get('description', {}).get('text') or ''
        start_time_str = event_data.get('start', {}).get('utc')
        date_time = _parse_eventbrite_start(start_time_str)

        venue = event_data.get('venue', {})
        event_obj = _upsert_eventbrite_event(
            event_id=event_id,
            name=name,
            description=description,
            date_time=date_time,
            external_data=event_data,
            latitude=venue.get('latitude'),
            longitude=venue.get('longitude'),
        )
        saved_events.append(event_obj)

    if saved_events:
        return saved_events, None

    return _sync_eventbrite_web_events(search_location)


def _sync_ticketmaster_events(city=None, size=20):
    api_key = getattr(settings, 'TICKETMASTER_API_KEY', '')
    if not api_key:
        return [], None

    now = timezone.now().strftime('%Y-%m-%dT%H:%M:%SZ')
    params = {'apikey': api_key, 'size': size, 'sort': 'date,asc', 'startDateTime': now}
    if city:
        params['city'] = city

    try:
        response = requests.get(
            'https://app.ticketmaster.com/discovery/v2/events.json',
            params=params,
            timeout=10,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as exc:
        logger.warning('Ticketmaster API request failed: %s', exc)
        return [], 'Ticketmaster events could not be loaded right now.'

    creator = _get_default_creator()
    saved_events = []

    for raw in response.json().get('_embedded', {}).get('events', []):
        try:
            tm_id = raw.get('id')
            if not tm_id:
                continue

            name = (raw.get('name') or 'Untitled Event')[:100]
            description = raw.get('info') or raw.get('description') or ''

            dates = raw.get('dates', {}).get('start', {})
            date_time = None
            date_str = dates.get('dateTime')
            if date_str:
                date_time = parse_datetime(date_str)
            if not date_time:
                local_date = dates.get('localDate')
                if local_date:
                    date_time = parse_datetime(local_date + 'T00:00:00Z')
            if not date_time:
                date_time = timezone.now()
            if timezone.is_naive(date_time):
                date_time = timezone.make_aware(date_time)

            location = None
            venues = raw.get('_embedded', {}).get('venues', [])
            if venues and Point is not None:
                lat = venues[0].get('location', {}).get('latitude')
                lng = venues[0].get('location', {}).get('longitude')
                if lat and lng:
                    try:
                        location = Point(float(lng), float(lat), srid=4326)
                    except (TypeError, ValueError):
                        pass

            event_obj, _ = Event.objects.update_or_create(
                ticketmaster_id=tm_id,
                defaults={
                    'name': name,
                    'description': description,
                    'date_time': date_time,
                    'location': location,
                    'creator': creator,
                    'source': 'ticketmaster',
                    'external_data': raw,
                    'last_synced': timezone.now(),
                },
            )
            _assign_categories(event_obj, name, description)
            saved_events.append(event_obj)
        except Exception as exc:
            logger.warning('Failed to save Ticketmaster event %s: %s', raw.get('id'), exc)

    return saved_events, None


@csrf_exempt
def toggle_event_interest(request, event_id):
    if request.method == 'OPTIONS':
        return _cors_json_response({'detail': 'ok'}, status=200)

    if request.method != 'POST':
        return _cors_json_response({'error': 'Method not allowed'}, status=405)

    event = Event.objects.filter(id=event_id).first()
    if not event:
        return _cors_json_response({'error': 'Event not found'}, status=404)

    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return _cors_json_response({'error': 'Invalid JSON payload'}, status=400)

    user_id = payload.get('user_id')
    if user_id in (None, ''):
        return _cors_json_response({'error': 'user_id is required'}, status=400)

    user = get_user_model().objects.filter(id=user_id).first()
    if not user:
        return _cors_json_response({'error': 'User not found'}, status=404)

    currently_interested = event.interested_users.filter(id=user.id).exists()
    if currently_interested:
        event.interested_users.remove(user)
        is_interested = False
        message = 'Interest removed'
    else:
        event.interested_users.add(user)
        is_interested = True
        message = 'Marked as interested'

    return _cors_json_response(
        {
            'message': message,
            'event_id': event.id,
            'is_interested': is_interested,
            'interested_count': event.interested_users.count(),
        },
        status=200,
    )


@csrf_exempt
def list_events(request):
    if request.method == 'OPTIONS':
        return _cors_json_response({'detail': 'ok'}, status=200)

    if request.method != 'GET':
        return _cors_json_response({'error': 'Method not allowed'}, status=405)

    search_location = request.GET.get('location', getattr(request.user, 'location', getattr(settings, 'EVENT_SEARCH_LOCATION', 'Orlando, FL')))
    search_radius = request.GET.get('radius', getattr(request.user, 'radius', getattr(settings, 'EVENT_SEARCH_RADIUS', '10')))
    refresh_requested = request.GET.get('refresh', '').lower() in {'1', 'true', 'yes'}
    sync_warning = None
    use_sample_event_fallback = getattr(settings, 'ENABLE_SAMPLE_EVENT_FALLBACK', True)

    api_key = getattr(settings, 'EVENTBRITE_API_KEY', '')
    latest_sync_cutoff = timezone.now() - timedelta(hours=2)
    has_fresh_eventbrite_data = Event.objects.filter(
        source='eventbrite',
        last_synced__gte=latest_sync_cutoff,
    ).exists()

    if api_key and (refresh_requested or not has_fresh_eventbrite_data):
        _saved_events, sync_warning = _sync_eventbrite_events(search_location, search_radius)
    elif not api_key and not use_sample_event_fallback:
        sync_warning = 'Sample event fallback is disabled. Configure EVENTBRITE_API_KEY to load live Eventbrite events.'

    tm_api_key = getattr(settings, 'TICKETMASTER_API_KEY', '')
    has_fresh_ticketmaster_data = Event.objects.filter(
        source='ticketmaster',
        last_synced__gte=latest_sync_cutoff,
    ).exists()
    if tm_api_key and (refresh_requested or not has_fresh_ticketmaster_data):
        city = search_location.split(',')[0].strip() if search_location else None
        _tm_events, tm_warning = _sync_ticketmaster_events(city=city)
        if tm_warning and not sync_warning:
            sync_warning = tm_warning

    if use_sample_event_fallback and not Event.objects.exists():
        seed_sample_events()

    events = Event.objects.select_related('creator').prefetch_related('categories', 'interested_users')
    if not use_sample_event_fallback:
        events = events.exclude(source='manual')

    user_id = request.GET.get('user_id')
    current_user = None
    if user_id not in (None, ''):
        current_user = get_user_model().objects.prefetch_related('interests', 'top_interests').filter(id=user_id).first()

    if current_user and getattr(current_user, 'location', None) and hasattr(Event, 'location') and Distance is not None:
        events = events.annotate(distance=Distance('location', current_user.location))

    event_list = list(events.order_by('date_time'))
    if current_user:
        preferred_radius = _coerce_positive_float(request.GET.get('radius'), current_user.radius or 10)
        event_list = _rank_events_for_user(event_list, current_user, preferred_radius)

    serializer_context = {'user_id': user_id}
    serialized = EventSerializer(event_list, many=True, context=serializer_context)

    payload = {'events': serialized.data}
    if sync_warning:
        payload['sync_warning'] = sync_warning

    return _cors_json_response(payload, status=200)


event_list = list_events

