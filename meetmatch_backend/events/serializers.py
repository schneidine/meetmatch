from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    interested_count = serializers.SerializerMethodField()
    creator_username = serializers.SerializerMethodField()
    category_names = serializers.SlugRelatedField(source='categories', many=True, read_only=True, slug_field='name')
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    is_interested = serializers.SerializerMethodField()
    distance_miles = serializers.SerializerMethodField()
    event_match_score = serializers.SerializerMethodField()
    interest_score = serializers.SerializerMethodField()
    location_score = serializers.SerializerMethodField()
    shared_category_names = serializers.SerializerMethodField()
    shared_top_category_names = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'name',
            'description',
            'date_time',
            'source',
            'eventbrite_id',
            'creator_username',
            'interested_count',
            'category_names',
            'latitude',
            'longitude',
            'is_interested',
            'distance_miles',
            'event_match_score',
            'interest_score',
            'location_score',
            'shared_category_names',
            'shared_top_category_names',
        ]

    def get_interested_count(self, obj):
        return obj.interested_users.count()

    def get_creator_username(self, obj):
        return obj.creator.username if obj.creator else None

    def get_latitude(self, obj):
        if hasattr(obj, 'location') and obj.location:
            return obj.location.y
        return getattr(obj, 'latitude', None)

    def get_longitude(self, obj):
        if hasattr(obj, 'location') and obj.location:
            return obj.location.x
        return getattr(obj, 'longitude', None)

    def get_is_interested(self, obj):
        user_id = self.context.get('user_id')
        if not user_id:
            return False

        try:
            return obj.interested_users.filter(id=int(user_id)).exists()
        except (TypeError, ValueError):
            return False

    def get_distance_miles(self, obj):
        return getattr(obj, 'distance_miles', None)

    def get_event_match_score(self, obj):
        return getattr(obj, 'event_match_score', None)

    def get_interest_score(self, obj):
        return getattr(obj, 'event_interest_score', None)

    def get_location_score(self, obj):
        return getattr(obj, 'event_location_score', None)

    def get_shared_category_names(self, obj):
        return getattr(obj, 'shared_category_names', [])

    def get_shared_top_category_names(self, obj):
        return getattr(obj, 'shared_top_category_names', [])
