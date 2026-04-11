from django.urls import path

from .views import user_matches

urlpatterns = [
    path("users/<int:user_id>/matches/", user_matches, name="user-matches"),
]
