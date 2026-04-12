from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['name', 'source', 'date_time', 'last_synced']
    list_filter = ['source']
    search_fields = ['name', 'description', 'ticketmaster_id', 'eventbrite_id']
