from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Interest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'age']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('age', 'radius', 'interests', 'location')}),
    )


@admin.register(Interest)
class InterestAdmin(admin.ModelAdmin):
    search_fields = ['name']
