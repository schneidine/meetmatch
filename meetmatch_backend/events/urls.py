from django.urls import path
from . import views

urlpatterns = [
    # Match teammate's existing route structure
    path('events/', views.list_events, name='event-list'),
    path('events/create/', views.create_event, name='event-create'),
    path('events/<int:event_id>/interest/', views.toggle_interest, name='event-toggle-interest'),
    path('events/sync/ticketmaster/', views.sync_ticketmaster, name='event-sync-ticketmaster'),
    path('events/sync/eventbrite/', views.sync_eventbrite, name='event-sync-eventbrite'),
]
