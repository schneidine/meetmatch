from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_events, name='event-list'),
    path('create/', views.create_event, name='event-create'),
    path('<int:event_id>/interest/', views.toggle_interest, name='event-toggle-interest'),
    path('sync/ticketmaster/', views.sync_ticketmaster, name='event-sync-ticketmaster'),
    path('sync/eventbrite/', views.sync_eventbrite, name='event-sync-eventbrite'),
]
