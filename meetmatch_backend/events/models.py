from django.db import models
from django.contrib.gis.db import models as geo_models # For PostGIS

# Create your models here.

class Event(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    date_time = models.DateTimeField()
    location = geo_models.PointField(null=True, blank=True, srid=4326) # Use PointField for GPS coordinates
    creator = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='created_events')
    interested_users = models.ManyToManyField('users.User', blank=True, related_name='events_interested_in')
    
    categories = models.ManyToManyField('users.Interest', blank=True, related_name='events')

    # External API integration fields
    eventbrite_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    ticketmaster_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    source = models.CharField(
        max_length=20,
        choices=[('eventbrite', 'Eventbrite'), ('ticketmaster', 'Ticketmaster'), ('manual', 'Manual')],
        default='manual',
    )
    external_data = models.JSONField(null=True, blank=True)
    last_synced = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} at {self.date_time.strftime('%Y-%m-%d %H:%M')}"
