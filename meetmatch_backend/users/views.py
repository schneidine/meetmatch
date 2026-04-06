# users/views.py
import json
import urllib.parse
import urllib.request

from django.contrib.gis.geos import Point
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate

from .models import Interest, User
from .serializers import RegisterSerializer, UserSerializer


DEFAULT_INTEREST_NAMES = [
    "Music", "Movies", "TV Shows", "Reading", "Gaming", "Travel",
    "Hiking", "Cooking", "Fitness", "Yoga", "Running", "Photography",
    "Art", "Dancing", "Technology", "Entrepreneurship", "Fashion",
    "Food", "Coffee", "Sports", "Basketball", "Soccer", "Volunteering",
    "Pets", "Board Games",
]


# ─── Helpers ────────────────────────────────────────────────────────────────

def _cors_json_response(payload, status=200):
    response = JsonResponse(payload, status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response


def _geocode_location(location_text):
    """Convert a human-readable location (e.g. 'Orlando, FL') to a Point."""
    query = urllib.parse.urlencode({"q": location_text, "format": "json", "limit": 1})
    url = f"https://nominatim.openstreetmap.org/search?{query}"
    req = urllib.request.Request(url, headers={"User-Agent": "MeetMatch/1.0"})
    with urllib.request.urlopen(req, timeout=5) as resp:
        results = json.loads(resp.read())
    if not results:
        raise ValueError(f"Location '{location_text}' could not be found")
    return Point(float(results[0]["lon"]), float(results[0]["lat"]), srid=4326)


def _ensure_default_interests():
    for name in DEFAULT_INTEREST_NAMES:
        Interest.objects.get_or_create(name=name)
    return Interest.objects.order_by("name")


# ─── Plain-Django endpoints (used by mobile frontend) ───────────────────────

@csrf_exempt
def signup(request):
    if request.method == "OPTIONS":
        return _cors_json_response({"detail": "ok"})
    if request.method != "POST":
        return _cors_json_response({"error": "Method not allowed"}, status=405)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return _cors_json_response({"error": "Invalid JSON payload"}, status=400)

    username   = payload.get("username", "").strip()
    first_name = payload.get("first_name", "").strip()
    last_name  = payload.get("last_name", "").strip()
    email      = payload.get("email", "").strip().lower()
    password   = payload.get("password", "")
    age        = payload.get("age")
    location   = payload.get("location", "").strip()

    if not all([username, first_name, last_name, email, password]) or age in (None, ""):
        return _cors_json_response(
            {"error": "first_name, last_name, username, email, age, and password are required"},
            status=400,
        )
    if User.objects.filter(email=email).exists():
        return _cors_json_response({"error": "Email already exists"}, status=400)
    if User.objects.filter(username=username).exists():
        return _cors_json_response({"error": "Username already exists"}, status=400)

    point = None
    if location:
        try:
            point = _geocode_location(location)
        except ValueError as exc:
            return _cors_json_response({"error": str(exc)}, status=400)
        except Exception:
            return _cors_json_response(
                {"error": "Could not look up location. Check your internet connection or try a different city name."},
                status=400,
            )

    user = User.objects.create_user(
        username=username, first_name=first_name, last_name=last_name,
        email=email, password=password, age=age, location=point,
    )
    return _cors_json_response(
        {"message": "Signup successful", "user": {"id": user.id, "username": user.username, "email": user.email}},
        status=201,
    )


@csrf_exempt
def login_view(request):
    if request.method == "OPTIONS":
        return _cors_json_response({"detail": "ok"})
    if request.method != "POST":
        return _cors_json_response({"error": "Method not allowed"}, status=405)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return _cors_json_response({"error": "Invalid JSON payload"}, status=400)

    identifier = payload.get("username", "").strip()
    password   = payload.get("password", "")

    if not identifier or not password:
        return _cors_json_response({"error": "username and password are required"}, status=400)

    user = (
        User.objects.filter(email=identifier.lower()).first()
        if "@" in identifier
        else User.objects.filter(username=identifier).first()
    )
    if not user or not user.check_password(password):
        return _cors_json_response({"error": "Invalid credentials"}, status=401)

    return _cors_json_response(
        {"message": "Login successful", "user": {"id": user.id, "username": user.username, "email": user.email}},
    )


@csrf_exempt
def interests(request):
    if request.method == "OPTIONS":
        return _cors_json_response({"detail": "ok"})
    if request.method != "GET":
        return _cors_json_response({"error": "Method not allowed"}, status=405)

    interest_qs = _ensure_default_interests()
    return _cors_json_response(
        {"interests": [{"id": i.id, "name": i.name} for i in interest_qs]}
    )


@csrf_exempt
def save_interests(request, user_id):
    if request.method == "OPTIONS":
        return _cors_json_response({"detail": "ok"})

    user = User.objects.filter(id=user_id).first()
    if not user:
        return _cors_json_response({"error": "User not found"}, status=404)

    if request.method == "GET":
        return _cors_json_response({
            "selected_interest_ids": list(user.interests.values_list("id", flat=True)),
            "top_interest_ids": list(user.top_interests.values_list("id", flat=True)),
        })

    if request.method != "POST":
        return _cors_json_response({"error": "Method not allowed"}, status=405)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return _cors_json_response({"error": "Invalid JSON payload"}, status=400)

    selected_ids = payload.get("selected_interest_ids", [])
    top_ids      = payload.get("top_interest_ids", [])

    if not isinstance(selected_ids, list) or not isinstance(top_ids, list):
        return _cors_json_response(
            {"error": "selected_interest_ids and top_interest_ids must be arrays"}, status=400
        )
    try:
        selected_ids = [int(v) for v in selected_ids]
        top_ids      = [int(v) for v in top_ids]
    except (TypeError, ValueError):
        return _cors_json_response({"error": "Interest IDs must be integers"}, status=400)

    selected_unique = list(dict.fromkeys(selected_ids))
    top_unique      = list(dict.fromkeys(top_ids))

    if len(selected_unique) < 3:
        return _cors_json_response({"error": "Please select at least 3 interests"}, status=400)
    if len(top_unique) != 3:
        return _cors_json_response({"error": "Please select exactly 3 top interests"}, status=400)
    if not set(top_unique).issubset(set(selected_unique)):
        return _cors_json_response({"error": "Top interests must be chosen from selected interests"}, status=400)

    selected = list(Interest.objects.filter(id__in=selected_unique))
    top      = list(Interest.objects.filter(id__in=top_unique))

    if len(selected) != len(selected_unique) or len(top) != len(top_unique):
        return _cors_json_response({"error": "One or more interests were invalid"}, status=400)

    user.interests.set(selected)
    user.top_interests.set(top)

    return _cors_json_response({
        "message": "Interests saved successfully",
        "selected_interest_ids": selected_unique,
        "top_interest_ids": top_unique,
    })


# ─── DRF endpoints (token auth, for future API clients) ─────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def drf_login(request):
    email    = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': UserSerializer(user).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    return Response(UserSerializer(request.user).data)
