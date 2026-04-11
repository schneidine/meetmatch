import json
import urllib.parse
import urllib.request

from django.contrib.gis.geos import Point
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import Interest, User


DEFAULT_INTEREST_NAMES = [
	"Music",
	"Movies",
	"TV Shows",
	"Reading",
	"Gaming",
	"Travel",
	"Hiking",
	"Cooking",
	"Fitness",
	"Yoga",
	"Running",
	"Photography",
	"Art",
	"Dancing",
	"Technology",
	"Entrepreneurship",
	"Fashion",
	"Food",
	"Coffee",
	"Sports",
	"Basketball",
	"Soccer",
	"Volunteering",
	"Pets",
	"Board Games",
]


def _geocode_location(location_text):
    """Convert a human-readable location (e.g. 'Orlando, FL') to a Point.
    Returns a Point or None. Raises ValueError if the location is not found.
    """
    query = urllib.parse.urlencode({"q": location_text, "format": "json", "limit": 1})
    url = f"https://nominatim.openstreetmap.org/search?{query}"
    req = urllib.request.Request(url, headers={"User-Agent": "MeetMatch/1.0"})
    with urllib.request.urlopen(req, timeout=5) as resp:
        results = json.loads(resp.read())
    if not results:
        raise ValueError(f"Location '{location_text}' could not be found")
    lat = float(results[0]["lat"])
    lon = float(results[0]["lon"])
    return Point(lon, lat, srid=4326)


def _cors_json_response(payload, status=200):
	response = JsonResponse(payload, status=status)
	response["Access-Control-Allow-Origin"] = "*"
	response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
	response["Access-Control-Allow-Headers"] = "Content-Type"
	return response


def _ensure_default_interests():
	for interest_name in DEFAULT_INTEREST_NAMES:
		Interest.objects.get_or_create(name=interest_name)

	return Interest.objects.order_by("name")


@csrf_exempt
def login(request):
	if request.method == "OPTIONS":
		return _cors_json_response({"detail": "ok"}, status=200)

	if request.method != "POST":
		return _cors_json_response({"error": "Method not allowed"}, status=405)

	try:
		payload = json.loads(request.body)
	except json.JSONDecodeError:
		return _cors_json_response({"error": "Invalid JSON payload"}, status=400)

	identifier = payload.get("username", "").strip()
	password = payload.get("password", "")

	if not identifier or not password:
		return _cors_json_response(
			{"error": "username and password are required"},
			status=400,
		)

	if "@" in identifier:
		user = User.objects.filter(email=identifier.lower()).first()
	else:
		user = User.objects.filter(username=identifier).first()

	if not user or not user.check_password(password):
		return _cors_json_response({"error": "Invalid credentials"}, status=401)

	return _cors_json_response(
		{
			"message": "Login successful",
			"user": {
				"id": user.id,
				"username": user.username,
				"email": user.email,
				"first_name": user.first_name,
				"last_name": user.last_name,
			},
		},
		status=200,
	)


@csrf_exempt
def signup(request):
	if request.method == "OPTIONS":
		return _cors_json_response({"detail": "ok"}, status=200)

	if request.method != "POST":
		return _cors_json_response({"error": "Method not allowed"}, status=405)

	try:
		payload = json.loads(request.body)
	except json.JSONDecodeError:
		return _cors_json_response({"error": "Invalid JSON payload"}, status=400)

	username = payload.get("username", "").strip()
	first_name = payload.get("first_name", "").strip()
	last_name = payload.get("last_name", "").strip()
	email = payload.get("email", "").strip().lower()
	password = payload.get("password", "")
	age = payload.get("age")
	location = payload.get("location", "").strip()

	if not username or not first_name or not last_name or not email or not password or age in [None, ""]:
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
		username=username,
		first_name=first_name,
		last_name=last_name,
		email=email,
		password=password,
		age=age,
		location=point,
	)

	return _cors_json_response(
		{
			"message": "Signup successful",
			"user": {
				"id": user.id,
				"username": user.username,
				"email": user.email,
				"first_name": user.first_name,
				"last_name": user.last_name,
			},
		},
		status=201,
	)


@csrf_exempt
def interests(request):
	if request.method == "OPTIONS":
		return _cors_json_response({"detail": "ok"}, status=200)

	if request.method != "GET":
		return _cors_json_response({"error": "Method not allowed"}, status=405)

	interest_queryset = _ensure_default_interests()

	return _cors_json_response(
		{
			"interests": [
				{"id": interest.id, "name": interest.name}
				for interest in interest_queryset
			]
		},
		status=200,
	)


@csrf_exempt
def save_interests(request, user_id):
	if request.method == "OPTIONS":
		return _cors_json_response({"detail": "ok"}, status=200)

	user = User.objects.filter(id=user_id).first()
	if not user:
		return _cors_json_response({"error": "User not found"}, status=404)

	if request.method == "GET":
		selected_ids = list(user.interests.values_list("id", flat=True))
		top_ids = list(user.top_interests.values_list("id", flat=True))
		return _cors_json_response(
			{
				"selected_interest_ids": selected_ids,
				"top_interest_ids": top_ids,
			},
			status=200,
		)

	if request.method != "POST":
		return _cors_json_response({"error": "Method not allowed"}, status=405)

	try:
		payload = json.loads(request.body)
	except json.JSONDecodeError:
		return _cors_json_response({"error": "Invalid JSON payload"}, status=400)

	selected_ids = payload.get("selected_interest_ids", [])
	top_ids = payload.get("top_interest_ids", [])

	if not isinstance(selected_ids, list) or not isinstance(top_ids, list):
		return _cors_json_response({"error": "selected_interest_ids and top_interest_ids must be arrays"}, status=400)

	try:
		selected_ids = [int(value) for value in selected_ids]
		top_ids = [int(value) for value in top_ids]
	except (TypeError, ValueError):
		return _cors_json_response({"error": "Interest IDs must be integers"}, status=400)

	selected_unique = list(dict.fromkeys(selected_ids))
	top_unique = list(dict.fromkeys(top_ids))

	if len(selected_unique) < 3:
		return _cors_json_response({"error": "Please select at least 3 interests"}, status=400)

	if len(top_unique) != 3:
		return _cors_json_response({"error": "Please select exactly 3 top interests"}, status=400)

	if not set(top_unique).issubset(set(selected_unique)):
		return _cors_json_response({"error": "Top interests must be chosen from selected interests"}, status=400)

	selected_interests = list(Interest.objects.filter(id__in=selected_unique))
	top_interests = list(Interest.objects.filter(id__in=top_unique))

	if len(selected_interests) != len(selected_unique) or len(top_interests) != len(top_unique):
		return _cors_json_response({"error": "One or more interests were invalid"}, status=400)

	user.interests.set(selected_interests)
	user.top_interests.set(top_interests)

	return _cors_json_response(
		{
			"message": "Interests saved successfully",
			"selected_interest_ids": selected_unique,
			"top_interest_ids": top_unique,
		},
		status=200,
	)
