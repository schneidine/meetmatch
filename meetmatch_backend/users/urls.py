from django.urls import path
from . import views

urlpatterns = [
    # Plain-Django endpoints (match teammate's existing setup)
    path('signup/', views.signup, name='signup'),
    path('login/', views.login_view, name='login'),
    path('interests/', views.interests, name='interests'),
    path('users/<int:user_id>/interests/', views.save_interests, name='save-interests'),

    # DRF token-auth endpoints (additive)
    path('register/', views.register, name='user-register'),
    path('token-login/', views.drf_login, name='user-drf-login'),
    path('profile/', views.profile, name='user-profile'),
]
