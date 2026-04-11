from django.urls import path

from .views import list_events, toggle_event_interest

urlpatterns = [
    path("events/", list_events, name="events-list"),
    path("events/<int:event_id>/interest/", toggle_event_interest, name="event-interest-toggle"),
]
