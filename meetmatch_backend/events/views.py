from django.shortcuts import render
from rest_framework.decorators import api_view
from .models import Event

# Create your views here.

'''
@api_view(['POST'])
def toggle_interest(request, event_id):
    event = Event.objects.get(id=event_id)
    if request.user in event.interested_users.all():
        event.interested_users.remove(request.user)
        return Response({"status": "removed"})
    else:
        event.interested_users.add(request.user)
        return Response({"status": "added"})

'''

