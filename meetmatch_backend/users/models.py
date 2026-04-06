from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models as geo_models # For PostGIS
# Create your models here.

class Interest(models.Model):
    name = models.CharField(max_length=50, unique=True)
    def __str__(self): return self.name

class User(AbstractUser):
    
    # AbstractUser already provides id, username, email, etc.
    email = models.EmailField(unique=True) # Ensure email is unique for login
    age = models.PositiveIntegerField(null=True, blank=True)
    
    # Use PointField for GPS coordinates (Longitude, Latitude)
    # Requires PostGIS installed in Postgres
    location = geo_models.PointField(null=True, blank=True, srid=4326)
    
    # Matching settings
    radius = models.PositiveIntegerField(default=10, help_text="Search radius in miles")
    interests = models.ManyToManyField(Interest, blank=True)
    top_interests = models.ManyToManyField(Interest, blank=True, related_name='top_interest_users')

    # Relationships
    friend_list = models.ManyToManyField('self', blank=True, symmetrical=False)
    events_interested = models.ManyToManyField('events.Event', blank=True)
    
    USERNAME_FIELD = 'email' # Use email for authentication instead of username
    REQUIRED_FIELDS = ['username', 'age'] # Email is used as USERNAME_FIELD
    
    def __str__(self):
        return f"{self.username} ({self.email}), {self.age} years old"
