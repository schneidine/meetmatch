# Django Backend Structure

Backend root: `meetmatch_backend/`

## High-level Layout

- `manage.py` - Django management entrypoint
- `requirements.txt` - Python dependencies
- `config/` - project-level Django configuration (settings, urls, wsgi/asgi)
- `users/` - custom user model + auth endpoints
- `events/` - event domain models and serializers
- `matching/` - matching app scaffold (currently minimal)
- `database_setup.md` - local DB setup notes

## `config/` (Project Config)

- `settings.py`
  - Loads environment values with `python-dotenv`
  - Uses PostGIS database backend via `dj-database-url`
  - Registers apps: `users`, `events`, `matching`, `rest_framework`, `corsheaders`
  - Enables CORS for frontend dev server (`localhost:3000`)
  - Sets `AUTH_USER_MODEL = 'users.User'`
- `urls.py`
  - `admin/` -> Django admin
  - `api/` -> includes `users.urls`
- `wsgi.py` / `asgi.py` - deployment/runtime entrypoints

## `users/` (Auth + User Domain)

- `models.py`
  - `Interest`
  - Custom `User` extending `AbstractUser` with geolocation and matching fields
  - User interest relations:
    - `interests` (selected interests)
    - `top_interests` (top 3)
- `views.py`
  - `signup` API endpoint (`POST /api/signup/`)
  - `login` API endpoint (`POST /api/login/`)
  - `interests` catalog endpoint (`GET /api/interests/`)
  - user interests endpoint (`GET/POST /api/users/<user_id>/interests/`)
  - CORS-friendly JSON responses for local dev/mobile
- `urls.py`
  - route definitions for signup/login/interests
- `migrations/` - schema migrations for user domain

## `events/` (Events Domain)

- `models.py`
  - `Event` with geospatial location + external provider metadata
- `serializers.py`
  - DRF serializer definitions for events
- `views.py`
  - event-related API views (app-level logic)
- `migrations/` - schema migrations for events

## `matching/` (Matching Domain)

- Contains scaffold files (`models.py`, `views.py`, etc.)
- Registered app, currently minimal implementation

## API Surface (Current)

- `POST /api/signup/`
- `POST /api/login/`
- `GET /api/interests/`
- `GET /api/users/<user_id>/interests/`
- `POST /api/users/<user_id>/interests/`

### Interest Save Rules

- selected interests must contain at least 3 items
- top interests must contain exactly 3 items
- top interests must be a subset of selected interests

CORS preflight (`OPTIONS`) is handled on user-facing API endpoints for local mobile/web development.
