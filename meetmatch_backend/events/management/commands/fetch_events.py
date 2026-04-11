from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.gis.geos import Point
from django.utils.dateparse import parse_datetime
from django.utils import timezone
import requests
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Fetch events from Eventbrite API and save to database'

    def handle(self, *args, **options):
        from events.models import Event
        
        SEARCH_LOCATION = 'Orlando, FL'
        SEARCH_RADIUS = '10'
        
        if not settings.EVENTBRITE_API_KEY:
            self.stdout.write(self.style.ERROR("EVENTBRITE_API_KEY is not configured"))
            return
        
        self.stdout.write(self.style.SUCCESS("Fetching events from Eventbrite..."))
        
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
                self.stdout.write(self.style.ERROR(f"API error: {response.status_code} - {response.text}"))
                return
            
            api_data = response.json()
            events = api_data.get('events', [])
            saved_count = 0
            updated_count = 0

            for event_data in events:
                try:
                    event_id = event_data.get('id')
                    name = event_data.get('name', {}).get('text', 'Untitled Event')
                    description = event_data.get('description', {}).get('text', '')
                    start_time_str = event_data.get('start', {}).get('utc')
                    date_time = parse_datetime(start_time_str) if start_time_str else None
                    
                    location = None
                    venue = event_data.get('venue', {})
                    if venue.get('latitude') and venue.get('longitude'):
                        location = Point(
                            x=float(venue.get('longitude')),
                            y=float(venue.get('latitude')),
                            srid=4326
                        )
                    
                    event_obj, created = Event.objects.update_or_create(
                        eventbrite_id=event_id,
                        defaults={
                            'name': name,
                            'description': description,
                            'date_time': date_time,
                            'location': location,
                            'source': 'eventbrite',
                            'external_data': event_data,
                            'last_synced': timezone.now(),
                        }
                    )
                    
                    if created:
                        saved_count += 1
                        self.stdout.write(self.style.SUCCESS(f"✓ Created: {name}"))
                    else:
                        updated_count += 1
                        self.stdout.write(self.style.WARNING(f"↻ Updated: {name}"))
                    
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"✗ Error processing event: {str(e)}"))

            self.stdout.write(self.style.SUCCESS(f"\n✓ Complete! Created: {saved_count}, Updated: {updated_count}"))
            
        except requests.exceptions.Timeout:
            self.stdout.write(self.style.ERROR("Request timed out"))
        except requests.exceptions.RequestException as e:
            self.stdout.write(self.style.ERROR(f"Request error: {str(e)}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Unexpected error: {str(e)}"))
