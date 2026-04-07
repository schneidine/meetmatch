from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    interested_count = serializers.IntegerField(source='interested_users.count', read_only=True)
    creator_username = serializers.CharField(source='creator.username', read_only=True)
    category_names = serializers.SlugRelatedField(source='categories', many=True, read_only=True, slug_field='name')
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'name',
            'description',
            'date_time',
            'source',
            'creator_username',
            'interested_count',
            'category_names',
            'latitude',
            'longitude',
        ]

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None
