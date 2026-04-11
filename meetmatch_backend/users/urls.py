from django.urls import path

from .views import interests, login, save_interests, signup

urlpatterns = [
    path("signup/", signup, name="signup"),
    path("login/", login, name="login"),
    path("interests/", interests, name="interests"),
    path("users/<int:user_id>/interests/", save_interests, name="save-interests"),
]
