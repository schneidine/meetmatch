from django.contrib.gis.db.models.functions import Distance
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from users.models import User


INTEREST_WEIGHT = 0.4
LOCATION_WEIGHT = 0.4
AGE_WEIGHT = 0.2
MIN_SHARED_INTERESTS = 2
SHARED_INTEREST_ALIGNMENT_WEIGHT = 0.3
SHARED_TOP_INTEREST_ALIGNMENT_WEIGHT = 0.5
CROSS_TOP_ALIGNMENT_WEIGHT = 0.2


def _cors_json_response(payload, status=200):
    response = JsonResponse(payload, status=status)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response


def _interest_name_map(user, field_name):
    return {interest.id: interest.name for interest in getattr(user, field_name).all()}


def _normalized_overlap(left_ids, right_ids):
    left_set = set(left_ids)
    right_set = set(right_ids)
    if not left_set or not right_set:
        return 0.0

    return len(left_set & right_set) / max(len(left_set), len(right_set))


def _score_interest_alignment(current_interests, candidate_interests, current_top_interests, candidate_top_interests):
    shared_interest_ratio = _normalized_overlap(current_interests, candidate_interests)
    shared_top_ratio = _normalized_overlap(current_top_interests, candidate_top_interests)

    cross_top_ids = (set(current_top_interests) & set(candidate_interests)) | (
        set(candidate_top_interests) & set(current_interests)
    )
    cross_top_ids -= set(current_top_interests) & set(candidate_top_interests)
    cross_top_ratio = len(cross_top_ids) / max(
        len(set(current_top_interests) | set(candidate_top_interests)), 1
    )

    interest_score = round(
        (
            (shared_interest_ratio * SHARED_INTEREST_ALIGNMENT_WEIGHT)
            + (shared_top_ratio * SHARED_TOP_INTEREST_ALIGNMENT_WEIGHT)
            + (cross_top_ratio * CROSS_TOP_ALIGNMENT_WEIGHT)
        )
        * 100
    )
    top_interest_score = round(((shared_top_ratio * 0.75) + (cross_top_ratio * 0.25)) * 100)

    return interest_score, top_interest_score


def _score_age_compatibility(current_user, candidate):
    if not current_user.age or not candidate.age:
        return 50, None

    age_gap = abs(current_user.age - candidate.age)
    if age_gap <= 2:
        return 100, age_gap
    if age_gap <= 5:
        return 75, age_gap
    if age_gap <= 8:
        return 50, age_gap
    if age_gap <= 12:
        return 25, age_gap
    return 0, age_gap


def _score_location_compatibility(current_user, candidate, distance_miles):
    if distance_miles is None:
        return 50

    preferred_radius = min(current_user.radius or 10, candidate.radius or 10)
    extended_radius = max(current_user.radius or 10, candidate.radius or 10)
    if distance_miles <= preferred_radius:
        return 100
    if distance_miles <= extended_radius:
        return 75
    if distance_miles <= extended_radius * 1.5:
        return 50
    return 0


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

    interest_score, top_interest_score = _score_interest_alignment(
        current_interests,
        candidate_interests,
        current_top_interests,
        candidate_top_interests,
    )

    age_score, age_gap = _score_age_compatibility(current_user, candidate)

    distance_miles = None
    distance = getattr(candidate, "distance", None)
    if distance is not None:
        distance_miles = round(distance.mi, 1)

    # Get the names of events the candidate is interested in
    interested_events_qs = getattr(candidate, 'events_interested', None)
    if interested_events_qs is not None:
        interested_event_names = list(interested_events_qs.values_list('name', flat=True))
    else:
        interested_event_names = []

    location_score = _score_location_compatibility(current_user, candidate, distance_miles)
    score = round(
        (interest_score * INTEREST_WEIGHT)
        + (location_score * LOCATION_WEIGHT)
        + (age_score * AGE_WEIGHT)
    )

    return {
        "id": candidate.id,
        "username": candidate.username,
        "first_name": candidate.first_name,
        "last_name": candidate.last_name,
        "email": candidate.email,
        "age": candidate.age,
        "match_score": score,
        "interest_score": interest_score,
        "top_interest_score": top_interest_score,
        "age_score": age_score,
        "location_score": location_score,
        "shared_interest_names": sorted(current_interests[interest_id] for interest_id in shared_interest_ids),
        "shared_top_interest_names": sorted(current_top_interests[interest_id] for interest_id in shared_top_ids),
        "top_interest_overlap_names": sorted(
            ({current_interests.get(interest_id) or current_top_interests.get(interest_id) for interest_id in cross_top_ids})
            - {None}
        ),
        "distance_miles": distance_miles,
        "age_gap": age_gap,
        "location_match": distance_miles is not None and distance_miles <= (current_user.radius or 10),
        "interestedEventNames": interested_event_names,
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
    matched_ids = list(user.matched_users.values_list("id", flat=True))

    candidates = User.objects.exclude(id=user.id)
    candidates = candidates.exclude(id__in=friend_ids)
    candidates = candidates.exclude(id__in=matched_ids)
    candidates = candidates.prefetch_related("interests", "top_interests")
    if user.location:
        candidates = candidates.annotate(distance=Distance("location", user.location))


    matches = []
    matched_candidate_ids = []
    for candidate in candidates:
        match_payload = _build_match_payload(user, candidate)
        shared_interest_count = len(match_payload["shared_interest_names"])
        shared_top_count = len(match_payload["shared_top_interest_names"])

        if shared_interest_count == 0:
            continue
        if shared_interest_count < MIN_SHARED_INTERESTS and shared_top_count == 0:
            continue

        matches.append(match_payload)
        matched_candidate_ids.append(candidate.id)

    # Add matched candidates to user's matched_users
    if matched_candidate_ids:
        user.matched_users.add(*matched_candidate_ids)

    matches.sort(
        key=lambda match: (
            -match["match_score"],
            -match.get("top_interest_score", 0),
            -len(match["shared_top_interest_names"]),
            -len(match["shared_interest_names"]),
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
