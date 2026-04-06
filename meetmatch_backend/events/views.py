# events/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Event
from .serializers import EventSerializer
from .services import sync_ticketmaster_events, sync_eventbrite_events
from .sample_data import seed_sample_events


@api_view(['GET'])
@permission_classes([AllowAny])
def list_events(request):
    """GET /api/events/ — list all events. Seeds sample data if the table is empty."""
    source = request.query_params.get('source')
    qs = Event.objects.select_related('creator').prefetch_related('categories', 'interested_users')

    if not qs.exists():
        seed_sample_events()

    if source:
        qs = qs.filter(source=source)

    serializer = EventSerializer(qs.order_by('date_time'), many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_event(request):
    """POST /api/events/create/ — create a manual event."""
    serializer = EventSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(creator=request.user, source='manual')
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_interest(request, event_id):
    """POST /api/events/<id>/interest/ — toggle the current user's interest."""
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return Response({'error': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.user in event.interested_users.all():
        event.interested_users.remove(request.user)
        return Response({'status': 'removed'})
    else:
        event.interested_users.add(request.user)
        return Response({'status': 'added'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_ticketmaster(request):
    """
    POST /api/events/sync/ticketmaster/
    Body (all optional): { "city": "Miami", "keyword": "music", "size": 20 }
    Requires TICKETMASTER_API_KEY in .env
    """
    city = request.data.get('city')
    keyword = request.data.get('keyword')
    size = int(request.data.get('size', 20))

    try:
        created, updated, errors = sync_ticketmaster_events(city=city, keyword=keyword, size=size)
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Ticketmaster API error: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

    return Response({'created': created, 'updated': updated, 'errors': errors})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_eventbrite(request):
    """
    POST /api/events/sync/eventbrite/
    Body (all optional): { "location_address": "Miami, FL", "keyword": "tech", "size": 20 }
    Requires EVENTBRITE_TOKEN in .env
    """
    location_address = request.data.get('location_address')
    keyword = request.data.get('keyword')
    size = int(request.data.get('size', 20))

    try:
        created, updated, errors = sync_eventbrite_events(
            location_address=location_address, keyword=keyword, size=size
        )
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': f'Eventbrite API error: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

    return Response({'created': created, 'updated': updated, 'errors': errors})
