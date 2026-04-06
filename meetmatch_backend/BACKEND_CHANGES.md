# MeetMatch Backend — Branch: `christopher/database-plan`

This document summarizes all backend changes made in this branch so the team can review before merging.
Everything in the `events` branch is preserved and untouched — this branch builds on top of it.

---

## What this branch adds

### 1. External API Integration (Ticketmaster + Eventbrite)

**File: `events/services.py`** *(new)*

This file handles fetching real events from two external APIs and saving them to the database.

- **`sync_ticketmaster_events(city, keyword, size)`** — calls the Ticketmaster Discovery API, pulls events, and upserts them into the `Event` table using `ticketmaster_id` as the unique key. If an event already exists it updates it; if it's new it creates it. Stores the raw API response in `external_data` for reference.

- **`sync_eventbrite_events(location_address, keyword, size)`** — same pattern but hits the Eventbrite API. Uses `eventbrite_id` as the unique key.

Both functions:
- Read API keys from `.env` (never hardcoded)
- Parse latitude/longitude from the venue data and store it as a PostGIS `Point`
- Return `(created_count, updated_count, errors)` so the caller knows what happened

API keys needed in `.env`:
```
TICKETMASTER_API_KEY=your_key
EVENTBRITE_TOKEN=your_token
```

---

### 2. Events Endpoints

**File: `events/views.py`** *(updated)*

| Method | URL | Auth | What it does |
|--------|-----|------|--------------|
| GET | `/api/events/` | No | List all events. Auto-seeds 13 sample events if the table is empty. |
| POST | `/api/events/create/` | Token required | Create a manual event. |
| POST | `/api/events/<id>/interest/` | Token required | Toggle "I'm interested" on an event. |
| POST | `/api/events/sync/ticketmaster/` | Token required | Pull events from Ticketmaster into the DB. |
| POST | `/api/events/sync/eventbrite/` | Token required | Pull events from Eventbrite into the DB. |

The sync endpoints accept a JSON body:
```json
{ "city": "Miami", "keyword": "music", "size": 20 }
```
They respond with how many events were created/updated and any errors.

---

### 3. Events Serializer

**File: `events/serializers.py`** *(updated — merged with teammate's version)*

The serializer is the code that converts a database `Event` object into JSON the frontend can read.

Fields returned per event:
| Field | What it is |
|-------|-----------|
| `id` | Database ID |
| `name` | Event name |
| `description` | Description text |
| `date_time` | When it happens (UTC) |
| `source` | Where it came from: `manual`, `ticketmaster`, or `eventbrite` |
| `creator_username` | Username of whoever created it |
| `interested_count` | Number of users who marked interest |
| `category_names` | List of interest/category tags e.g. `["Music", "Coffee"]` |
| `latitude` | Decimal latitude (extracted from PostGIS point) |
| `longitude` | Decimal longitude (extracted from PostGIS point) |
| `external_data` | Full raw JSON from the external API (null for manual events) |
| `last_synced` | When it was last synced from the external API |

---

### 4. Sample Data (from teammate's branch)

**File: `events/sample_data.py`** *(new — copied from `events` branch)*

Seeds 13 realistic local events (Live Music Night, Coffee Meetup, Board Game Social, etc.) with Orlando coordinates and interest categories. These are created automatically the first time `GET /api/events/` is hit and the table is empty — so the app works out of the box without needing an API key.

---

### 5. Users Endpoints

**File: `users/views.py`** *(updated — merged both approaches)*

The teammate's mobile-style endpoints and the DRF token endpoints now live in the same file.

**Plain-Django endpoints** (used by the mobile frontend — same style as teammate's `events` branch):

| Method | URL | What it does |
|--------|-----|--------------|
| POST | `/api/users/signup/` | Create account. Accepts `username`, `first_name`, `last_name`, `email`, `password`, `age`, and an optional `location` text (e.g. `"Orlando, FL"`) which gets geocoded to lat/lng via OpenStreetMap. |
| POST | `/api/users/login/` | Login with email or username + password. Returns user info. |
| GET | `/api/users/interests/` | Returns the full list of 25 default interests (Music, Gaming, etc.). Also creates them in the DB if they don't exist yet. |
| GET/POST | `/api/users/interests/<user_id>/` | GET returns which interests a user has selected. POST saves their selected interests (min 3) and top 3 interests. |

**DRF token-auth endpoints** (for API clients that need a token):

| Method | URL | What it does |
|--------|-----|--------------|
| POST | `/api/users/register/` | Create account, returns an auth token immediately. |
| POST | `/api/users/token-login/` | Login with email + password, returns token. |
| GET | `/api/users/profile/` | Returns current user's info. Requires `Authorization: Token <token>` header. |

---

### 6. Users Model

**File: `users/models.py`** *(updated)*

Added the `top_interests` field that was in the teammate's model but missing from ours:

```python
top_interests = models.ManyToManyField(Interest, blank=True, related_name='top_interest_users')
```

This lets a user select up to 3 "top" interests out of their full interest list — used by the interest-selection screen.

**File: `users/migrations/0002_user_top_interests.py`** *(new)*

The database migration for the field above. Run `python manage.py migrate` to apply it.

---

### 7. Users Serializers

**File: `users/serializers.py`** *(new)*

Two serializers used by the DRF token endpoints:

- **`RegisterSerializer`** — validates a new user's data and handles password hashing correctly.
- **`UserSerializer`** — returns safe public user info (id, username, email, age, radius). Never exposes the password.

---

### 8. Settings

**File: `config/settings.py`** *(updated)*

| What changed | Why |
|---|---|
| `GDAL_LIBRARY_PATH` / `GEOS_LIBRARY_PATH` now read from `.env` | Was hardcoded to `/opt/homebrew/lib/...` which only works on the original dev's Mac |
| `SECRET_KEY` now reads from `.env` | Should never be hardcoded |
| `DEBUG` now reads from `.env` | Easier to toggle without touching code |
| `ALLOWED_HOSTS` now reads from `.env` as a comma-separated list | Required for production |
| Added `rest_framework.authtoken` to `INSTALLED_APPS` | Enables token-based auth |
| Added `corsheaders` to `INSTALLED_APPS` and `MIDDLEWARE` | Lets the frontend talk to the backend across ports |
| Added `REST_FRAMEWORK` config block | Sets token auth as default, requires login unless endpoint opts out |
| Added `CORS_ALLOW_ALL_ORIGINS = True` | Dev-only — lets any frontend hit the API locally |

---

### 9. Admin

**File: `events/admin.py`** *(updated)*

Events are now visible in `/admin/` with filters by source and search by name/ID.

**File: `users/admin.py`** *(updated)*

Users and Interests are now visible in `/admin/` so you can view/edit without Postman.

---

### 10. `.env.example`

**File: `meetmatch_backend/.env.example`** *(new)*

Copy this to `.env` and fill in your values before running the server:

```
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=meetmatch_db
ENVIRONMENT=local
GDAL_LIBRARY_PATH=/opt/homebrew/lib/libgdal.dylib
GEOS_LIBRARY_PATH=/opt/homebrew/lib/libgeos_c.dylib
TICKETMASTER_API_KEY=          # optional
EVENTBRITE_TOKEN=              # optional
```

---

### 11. Requirements

**File: `requirements.txt`** *(updated)*

Added:
- `djangorestframework` — DRF framework (was already being used but not listed)
- `django-cors-headers` — allows frontend to call the API from a different port
- `requests` — used by the external API service to make HTTP calls

---

## How to run

```bash
cd meetmatch_backend
cp .env.example .env        # fill in your values
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Then hit `GET http://localhost:8000/api/events/` — it will auto-seed 13 sample events on first load.

---

## URL map (full)

```
/admin/

/api/users/signup/
/api/users/login/
/api/users/interests/
/api/users/interests/<user_id>/
/api/users/register/
/api/users/token-login/
/api/users/profile/

/api/events/
/api/events/create/
/api/events/<id>/interest/
/api/events/sync/ticketmaster/
/api/events/sync/eventbrite/
```
