# events/serializers.py
from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    # This shows the count of interested people instead of the whole list
    interested_count = serializers.IntegerField(source='interested_users.count', read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'name', 'description', 'location', 'date_time', 'interested_count', 'eventbrite_id', 'source']