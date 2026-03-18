# MeetMatch Database & API Setup Plan

Goal: Get the backend wired up so we can test it with the frontend.

---

## Step 1 — Fix bug in events/serializers.py

The file has a typo: `class Model:` should be `class Meta:`
This makes the whole serializer broken right now. Zero-risk fix.

---

## Step 2 — Create users/serializers.py (new file)

Two serializers:
- RegisterSerializer — validates and creates a new user (handles password hashing)
- UserSerializer — returns public user info (no password)

---

## Step 3 — Create users/views.py

Three endpoints:
- POST /api/users/register/   → sign up, returns an auth token
- POST /api/users/login/      → sign in with email + password, returns token
- GET  /api/users/profile/    → returns current user's profile (requires token)

---

## Step 4 — Create events/views.py

Three endpoints:
- GET  /api/events/                → list all events (public)
- POST /api/events/create/         → create a new event (must be logged in)
- POST /api/events/<id>/interest/  → toggle "I'm interested" on an event (must be logged in)

---

## Step 5 — Wire up URL routing

Create:
- users/urls.py
- events/urls.py

Update:
- config/urls.py to include both

---

## Step 6 — Update config/settings.py

Add to INSTALLED_APPS:
- rest_framework.authtoken  (enables token auth, already built into DRF — no extra install)
- corsheaders               (so the React frontend can talk to the API)

Add REST_FRAMEWORK config block:
- Set token authentication as default
- Set permissions so endpoints require login unless marked public

Add CORS setting:
- CORS_ALLOW_ALL_ORIGINS = True  (local dev only — lock this down before production)

---

## Step 7 — Update requirements.txt

Add:
- djangorestframework   (it's used but not listed)
- django-cors-headers   (new dependency for frontend/backend communication)

---

## Step 8 — Register models in Django admin

So we can log in at /admin/ and view/edit Users, Interests, and Events
directly without needing Postman or any other tool.

---

## Summary of new API endpoints

| Method | URL                          | Auth required | Description              |
|--------|------------------------------|---------------|--------------------------|
| POST   | /api/users/register/         | No            | Create account           |
| POST   | /api/users/login/            | No            | Login, get token         |
| GET    | /api/users/profile/          | Yes           | Get current user info    |
| GET    | /api/events/                 | No            | List all events          |
| POST   | /api/events/create/          | Yes           | Create a new event       |
| POST   | /api/events/<id>/interest/   | Yes           | Toggle interest on event |

---

## Notes

- Auth uses DRF's built-in Token Authentication (no extra packages beyond what's listed above)
- Tokens are returned on register and login — frontend stores and sends them in headers
- Matching logic (matching app) is a separate phase, not included here
- External API sync (Eventbrite / Ticketmaster) is also a separate phase
