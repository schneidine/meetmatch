from django.urls import path
from . import views

urlpatterns = [
    # Plain-Django endpoints (used by mobile frontend)
    path('signup/', views.signup, name='user-signup'),
    path('login/', views.login_view, name='user-login'),
    path('interests/', views.interests, name='user-interests'),
    path('interests/<int:user_id>/', views.save_interests, name='user-save-interests'),

    # DRF token-auth endpoints (for API clients)
    path('register/', views.register, name='user-register'),
    path('token-login/', views.drf_login, name='user-drf-login'),
    path('profile/', views.profile, name='user-profile'),
]
