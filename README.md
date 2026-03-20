# MeetMatch

MeetMatch is a friend-matching and events app with a mobile-first frontend.

## Stack

- Django + Django REST (backend API)
- PostgreSQL + PostGIS (database)
- Expo / React Native (primary frontend)
- CRA React web app (legacy/secondary)

## Project Structure

- `meetmatch_backend/` - Django backend and API
- `frontend/meetmatch_mobile/` - primary Expo mobile app (iOS/Android/Web)
- `frontend/meetmatch_frontend/` - legacy CRA web frontend
- `start.sh` - starts backend + Expo mobile together

Detailed docs:

- [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)
- [DJANGO_BACKEND_STRUCTURE.md](DJANGO_BACKEND_STRUCTURE.md)
- [FRONTEND_STRUCTURE.md](FRONTEND_STRUCTURE.md)

## Prerequisites

- Python 3.13+
- Node.js + npm
- PostgreSQL with PostGIS extension
- macOS geospatial libs (if needed):
  - `brew install postgis gdal geos`

## Environment Setup

Create `meetmatch_backend/.env`:

```env
DATABASE_NAME=meetmatch
DATABASE_PASSWORD=your_postgres_password
ENVIRONMENT=local
DEBUG=True
```

## Install Dependencies

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r meetmatch_backend/requirements.txt
```

### Mobile Frontend (Primary)

```bash
cd frontend/meetmatch_mobile
npm install
cd ../..
```

## Run the App (One Command)

From repo root:

```bash
./start.sh
```

This starts:

- Backend on `http://0.0.0.0:8000`
- Expo Metro on `http://localhost:8081`

`start.sh` auto-detects your LAN IP and sets `EXPO_PUBLIC_API_BASE_URL` for Expo.

## Current User Flow (Mobile)

1. Login or Signup
2. After signup, user is sent to Interests selection
3. After interests are saved, user lands on Main app
4. Main app tabs (swipe + bottom nav): Matches, Events, Profile
5. Profile supports editing location/radius, editing interests, and logout

## API Endpoints (Current)

- `POST /api/signup/`
- `POST /api/login/`
- `GET /api/interests/`
- `GET /api/users/<user_id>/interests/`
- `POST /api/users/<user_id>/interests/`

`POST /api/login/` accepts username or email in the `username` field.

## Common Commands

Backend checks/migrations:

```bash
source .venv/bin/activate
cd meetmatch_backend
python manage.py check
python manage.py migrate
```

Mobile scripts:

```bash
cd frontend/meetmatch_mobile
npm start
npm run ios
npm run android
npm run web
```

Legacy web frontend (optional):

```bash
cd frontend/meetmatch_frontend
npm start
```
