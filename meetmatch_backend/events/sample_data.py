from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.utils import timezone

from users.models import Interest

from .models import Event


SAMPLE_EVENT_SPECS = [
    {
        "name": "Live Music Night",
        "description": "Catch local artists, meet new people, and enjoy an easygoing night downtown.",
        "days": 2,
        "hours": 19,
        "latitude": 28.5383,
        "longitude": -81.3792,
        "categories": ["Music", "Coffee"],
    },
    {
        "name": "Coffee Meetup",
        "description": "A casual Saturday morning meetup for coffee lovers and first-time attendees.",
        "days": 3,
        "hours": 11,
        "latitude": 28.5410,
        "longitude": -81.3747,
        "categories": ["Coffee", "Food"],
    },
    {
        "name": "Board Game Social",
        "description": "Bring your favorite strategy game or join a table and make new friends.",
        "days": 4,
        "hours": 15,
        "latitude": 28.5454,
        "longitude": -81.3820,
        "categories": ["Board Games", "Gaming"],
    },
    {
        "name": "Sunset Walk Club",
        "description": "Low-pressure evening walk with conversation starters and scenic city views.",
        "days": 5,
        "hours": 18,
        "latitude": 28.5520,
        "longitude": -81.3683,
        "categories": ["Hiking", "Fitness"],
    },
    {
        "name": "Indie Film Watch Party",
        "description": "Watch an indie favorite, talk plot twists, and meet other movie buffs.",
        "days": 6,
        "hours": 20,
        "latitude": 28.5484,
        "longitude": -81.3770,
        "categories": ["Movies", "TV Shows"],
    },
    {
        "name": "Book & Brunch Circle",
        "description": "Bring your latest read, share recommendations, and enjoy a relaxed brunch.",
        "days": 7,
        "hours": 10,
        "latitude": 28.5339,
        "longitude": -81.3702,
        "categories": ["Reading", "Cooking"],
    },
    {
        "name": "Sunrise Yoga in the Park",
        "description": "Start the day with a gentle flow session followed by a short community run.",
        "days": 8,
        "hours": 8,
        "latitude": 28.5592,
        "longitude": -81.3851,
        "categories": ["Yoga", "Running", "Fitness"],
    },
    {
        "name": "Photo Walk Downtown",
        "description": "Explore colorful city spots and trade photography tips while walking together.",
        "days": 9,
        "hours": 17,
        "latitude": 28.5468,
        "longitude": -81.3729,
        "categories": ["Photography", "Art", "Travel"],
    },
    {
        "name": "Salsa & Social Night",
        "description": "A beginner-friendly dance night with icebreakers and upbeat music.",
        "days": 10,
        "hours": 19,
        "latitude": 28.5405,
        "longitude": -81.3658,
        "categories": ["Dancing", "Music"],
    },
    {
        "name": "Startup Makers Meetup",
        "description": "Talk product ideas, side projects, and entrepreneurship with local builders.",
        "days": 11,
        "hours": 18,
        "latitude": 28.5515,
        "longitude": -81.3904,
        "categories": ["Technology", "Entrepreneurship"],
    },
    {
        "name": "Thrift & Style Swap",
        "description": "Refresh your wardrobe, swap pieces, and chat fashion with creative locals.",
        "days": 12,
        "hours": 13,
        "latitude": 28.5357,
        "longitude": -81.3867,
        "categories": ["Fashion", "Art"],
    },
    {
        "name": "Community Sports Mixer",
        "description": "Join casual pickup games and team challenges for all skill levels.",
        "days": 13,
        "hours": 16,
        "latitude": 28.5630,
        "longitude": -81.3762,
        "categories": ["Sports", "Basketball", "Soccer"],
    },
    {
        "name": "Volunteer & Pets Day",
        "description": "Help out at a local shelter and spend time with adoptable pets afterward.",
        "days": 14,
        "hours": 12,
        "latitude": 28.5298,
        "longitude": -81.3601,
        "categories": ["Volunteering", "Pets"],
    },
]


def seed_sample_events():
    User = get_user_model()
    organizer, created = User.objects.get_or_create(
        email="organizer@meetmatch.local",
        defaults={
            "username": "meetmatch_organizer",
            "first_name": "MeetMatch",
            "last_name": "Team",
            "age": 28,
        },
    )
    if created:
        organizer.set_password("demo-password-123")
        organizer.save(update_fields=["password"])

    seeded_events = []
    for spec in SAMPLE_EVENT_SPECS:
        event, _created = Event.objects.update_or_create(
            name=spec["name"],
            source="manual",
            defaults={
                "description": spec["description"],
                "date_time": timezone.now() + timedelta(days=spec["days"], hours=spec["hours"]),
                "location": Point(spec["longitude"], spec["latitude"], srid=4326),
                "creator": organizer,
                "external_data": {"seeded": True, "categories": spec["categories"]},
            },
        )

        categories = [Interest.objects.get_or_create(name=name)[0] for name in spec["categories"]]
        event.categories.set(categories)
        seeded_events.append(event)

    return seeded_events
