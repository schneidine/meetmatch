import json
import urllib.parse
import urllib.request

from django.contrib.gis.geos import Point
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import User


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
	response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
	response["Access-Control-Allow-Headers"] = "Content-Type"
	return response


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
	email = payload.get("email", "").strip().lower()
	password = payload.get("password", "")
	age = payload.get("age")
	location = payload.get("location", "").strip()

	if not username or not email or not password or age in [None, ""]:
		return _cors_json_response(
			{"error": "username, email, age, and password are required"},
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
			},
		},
		status=201,
	)
