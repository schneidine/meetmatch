from django.contrib.gis.db.models.functions import Distance
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from users.models import User


def _cors_json_response(payload, status=200):
    response = JsonResponse(payload, status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response


def _interest_name_map(user, field_name):
    return {interest.id: interest.name for interest in getattr(user, field_name).all()}


def _build_match_payload(current_user, candidate):
    current_interests = _interest_name_map(current_user, "interests")
    candidate_interests = _interest_name_map(candidate, "interests")
    current_top_interests = _interest_name_map(current_user, "top_interests")
    candidate_top_interests = _interest_name_map(candidate, "top_interests")

    shared_interest_ids = set(current_interests) & set(candidate_interests)
    shared_top_ids = set(current_top_interests) & set(candidate_top_interests)
    cross_top_ids = (set(current_top_interests) & set(candidate_interests)) | (
        set(candidate_top_interests) & set(current_interests)
    )
    cross_top_ids -= shared_top_ids

    score = len(shared_interest_ids) * 15
    score += len(shared_top_ids) * 25
    score += len(cross_top_ids) * 10

    age_gap = None
    if current_user.age and candidate.age:
        age_gap = abs(current_user.age - candidate.age)
        if age_gap <= 2:
            score += 15
        elif age_gap <= 5:
            score += 8
        elif age_gap <= 10:
            score += 3

    distance_miles = None
    distance = getattr(candidate, "distance", None)
    if distance is not None:
        distance_miles = round(distance.mi, 1)
        preferred_radius = min(current_user.radius or 10, candidate.radius or 10)
        extended_radius = max(current_user.radius or 10, candidate.radius or 10)
        if distance_miles <= preferred_radius:
            score += 20
        elif distance_miles <= extended_radius:
            score += 10

    return {
        "id": candidate.id,
        "username": candidate.username,
        "first_name": candidate.first_name,
        "last_name": candidate.last_name,
        "email": candidate.email,
        "age": candidate.age,
        "match_score": score,
        "shared_interest_names": sorted(current_interests[interest_id] for interest_id in shared_interest_ids),
        "shared_top_interest_names": sorted(current_top_interests[interest_id] for interest_id in shared_top_ids),
        "top_interest_overlap_names": sorted(
            ({current_interests.get(interest_id) or current_top_interests.get(interest_id) for interest_id in cross_top_ids})
            - {None}
        ),
        "distance_miles": distance_miles,
        "age_gap": age_gap,
        "location_match": distance_miles is not None and distance_miles <= (current_user.radius or 10),
    }


@csrf_exempt
def user_matches(request, user_id):
    if request.method == "OPTIONS":
        return _cors_json_response({"detail": "ok"}, status=200)

    if request.method != "GET":
        return _cors_json_response({"error": "Method not allowed"}, status=405)

    user = (
        User.objects.prefetch_related("interests", "top_interests", "friend_list")
        .filter(id=user_id)
        .first()
    )
    if not user:
        return _cors_json_response({"error": "User not found"}, status=404)

    if user.interests.count() < 3:
        return _cors_json_response(
            {"error": "Please select interests before requesting matches."},
            status=400,
        )

    try:
        limit = int(request.GET.get("limit", 10))
    except (TypeError, ValueError):
        return _cors_json_response({"error": "limit must be an integer"}, status=400)

    limit = max(1, min(limit, 50))
    friend_ids = list(user.friend_list.values_list("id", flat=True))

    candidates = User.objects.exclude(id=user.id).exclude(id__in=friend_ids).prefetch_related(
        "interests", "top_interests"
    )
    if user.location:
        candidates = candidates.annotate(distance=Distance("location", user.location))

    matches = []
    for candidate in candidates:
        match_payload = _build_match_payload(user, candidate)
        if not match_payload["shared_interest_names"]:
            continue
        matches.append(match_payload)

    matches.sort(
        key=lambda match: (
            -match["match_score"],
            len(match["shared_top_interest_names"]),
            len(match["shared_interest_names"]),
            match["username"].lower(),
        )
    )

    return _cors_json_response(
        {
            "user_id": user.id,
            "match_count": len(matches[:limit]),
            "matches": matches[:limit],
        },
        status=200,
    )
