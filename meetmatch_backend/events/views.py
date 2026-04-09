from django.shortcuts import render
from rest_framework.decorators import api_view
from django.conf import settings
from django.utils.dateparse import parse_datetime
from django.utils import timezone
import requests
from rest_framework.response import Response
from .models import Event
from .serializers import EventSerializer
import logging

# Import Point only if PostGIS is available
if 'django.contrib.gis' in settings.INSTALLED_APPS:
    from django.contrib.gis.geos import Point

logger = logging.getLogger(__name__)

@api_view(['GET'])
def event_list(request):
    """Fetch events from Eventbrite API based on location and save them to the database.
       Future improvements could include using user's settings, caching results, and handling pagination."""
    
    # Variables for easy future migration
    SEARCH_LOCATION = 'Orlando, FL'
    SEARCH_RADIUS = '10'
    
    if not settings.EVENTBRITE_API_KEY:
        logger.error("EVENTBRITE_API_KEY is not configured")
        return Response({'error': 'API key not configured'}, status=500)
    
    try:
        response = requests.get(
            'https://www.eventbriteapi.com/v3/events/search/',
            headers={
                'Authorization': f'Bearer {settings.EVENTBRITE_API_KEY}'
            },
            params={
                'location.address': SEARCH_LOCATION,
                'location.within': f'{SEARCH_RADIUS}mi',
                'expand': 'venue',
            },
            timeout=10
        )

        if response.status_code != 200:
            logger.error(f"Eventbrite API error: {response.status_code} - {response.text}") 
            return Response({'error': 'Failed to fetch events'}, status=502)
        
        api_data = response.json()
        events = api_data.get('events', [])
        saved_events = []

        for event_data in events:
            try:
                # Extract event details
                event_id = event_data.get('id')
                name = event_data.get('name', {}).get('text', 'Untitled Event')
                description = event_data.get('description', {}).get('text', '')
                start_time_str = event_data.get('start', {}).get('utc')
                
                # Parse datetime
                date_time = parse_datetime(start_time_str) if start_time_str else None
                
                # Prepare location data based on database backend
                defaults = {
                    'name': name,
                    'description': description,
                    'date_time': date_time,
                    'source': 'eventbrite',
                    'external_data': event_data,
                    'last_synced': timezone.now(),
                }
                
                # Extract location coordinates from venue
                venue = event_data.get('venue', {})
                lat = venue.get('latitude')
                lng = venue.get('longitude')
                
                if lat and lng:
                    if 'django.contrib.gis' in settings.INSTALLED_APPS:
                        # PostGIS: use PointField
                        defaults['location'] = Point(x=float(lng), y=float(lat), srid=4326)
                    else:
                        # SQLite: use separate lat/lng fields
                        defaults['latitude'] = float(lat)
                        defaults['longitude'] = float(lng)
                
                # Create or update event in database
                event_obj, created = Event.objects.update_or_create(
                    eventbrite_id=event_id,
                    defaults=defaults
                )
                saved_events.append(event_obj)
                logger.info(f"{'Created' if created else 'Updated'} event: {name} (ID: {event_id})")
                
            except Exception as e:
                logger.error(f"Error processing event {event_data.get('id')}: {str(e)}")
                continue

        # Serialize and return saved events
        serializer = EventSerializer(saved_events, many=True)
        return Response({
            'count': len(saved_events),
            'events': serializer.data
        })
        
    except requests.exceptions.Timeout:
        logger.error("Eventbrite API request timed out")
        return Response({'error': 'Request timed out'}, status=504)
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error: {str(e)}")
        return Response({'error': 'Failed to fetch events'}, status=502)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return Response({'error': 'Internal server error'}, status=500)
# Mobile_dev changes here
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Event
from .sample_data import seed_sample_events
from .serializers import EventSerializer


def _cors_json_response(payload, status=200):
    response = JsonResponse(payload, status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@csrf_exempt
def list_events(request):
    if request.method == "OPTIONS":
        return _cors_json_response({"detail": "ok"}, status=200)

    if request.method != "GET":
        return _cors_json_response({"error": "Method not allowed"}, status=405)

    if not Event.objects.exists():
        seed_sample_events()

    events = Event.objects.select_related("creator").prefetch_related("categories", "interested_users").order_by("date_time")
    serialized = EventSerializer(events, many=True)
    return _cors_json_response({"events": serialized.data}, status=200)

