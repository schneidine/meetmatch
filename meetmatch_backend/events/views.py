from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Event
from .sample_data import seed_sample_events
from .serializers import EventSerializer


def _cors_json_response(payload, status=200):
    response = JsonResponse(payload, status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@csrf_exempt
def list_events(request):
    if request.method == "OPTIONS":
        return _cors_json_response({"detail": "ok"}, status=200)

    if request.method != "GET":
        return _cors_json_response({"error": "Method not allowed"}, status=405)

    if not Event.objects.exists():
        seed_sample_events()

    events = Event.objects.select_related("creator").prefetch_related("categories", "interested_users").order_by("date_time")
    serialized = EventSerializer(events, many=True)
    return _cors_json_response({"events": serialized.data}, status=200)

