# MeetMatch

Ever found an event nearby that you wanted to attend, but had no one to go with? MeetMatch is a friend-matching and event discovery mobile app that connects users to nearby events based on their interests, location, and other preferences. It also matches users with others who share similar interests and are planning to attend the same events, making it easier to find people to go with.

MeetMatch was developed by a team of five for **Project Launch**, a premier semester-long development competition hosted by **Knight Hacks at the University of Central Florida (UCF)**. 

### Team

| Member | Role | GitHub |
| :--- | :--- | :--- |
| **Onella Moitra** | Team Lead & Lead Developer | [@onella-moitra](https://github.com/onella-moitra) |
| **Schneidine Dorelien** | Backend/EventBrite API Integration | [@schneidine](https://github.com/scheidine) |
| **Gabriel Moody** | Frontend/UI | [@uGoobyM](https://github.com/GoobyM) |
| **Cristoffer Bohorquez** | Backend/Ticketmaster API Integration | [@Cristofferb7](https://github.com/Cristofferb7) |
| **Diego Rolon** | Chat/ChatThread Functionality | [@Ywrd10](https://github.com/Ywrd10) |

## Stack

- Django + Django REST (backend API)
- PostgreSQL + PostGIS (database)
- Expo / React Native (primary frontend)
- CRA React web app (legacy/secondary)

The backend can run either locally or in Docker. For Docker-specific setup, see [DOCKER.md](DOCKER.md).

## Project Structure

- `meetmatch_backend/` - Django backend and API
- `frontend/meetmatch_mobile/` - primary Expo mobile app (iOS/Android/Web)
- `frontend/meetmatch_frontend/` - legacy CRA web frontend
- `start.sh` - starts backend + Expo mobile together

Detailed docs:

- [DATABASE_STRUCTURE.md](DATABASE_STRUCTURE.md)
- [DJANGO_BACKEND_STRUCTURE.md](DJANGO_BACKEND_STRUCTURE.md)
- [FRONTEND_STRUCTURE.md](FRONTEND_STRUCTURE.md)
- [DOCKER.md](DOCKER.md)

## Prerequisites

- Python 3.13+
- Node.js + npm
- PostgreSQL with PostGIS extension
- macOS geospatial libs (if needed):
  - `brew install postgis gdal geos`

If you are using Docker instead of local services, install Docker Desktop and use the instructions in [DOCKER.md](DOCKER.md).

## Environment Setup

Copy `.env.example` to `.env` at the repo root and fill in real values:

```env
DEBUG=True
ENVIRONMENT=local
DATABASE_NAME=meetmatch
DATABASE_USER=postgres
DATABASE_PASSWORD=your_postgres_password
DATABASE_HOST=db
DATABASE_PORT=5432
DJANGO_SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
ENVIRONMENT=local
EVENTBRITE_API_KEY=your_eventbrite_token
```

The backend reads `DJANGO_SECRET_KEY`, `DATABASE_*`, and `EVENTBRITE_API_KEY` from this file when running locally or in Docker.

## Install Dependencies

### Backend Docker Workflow

If you want the backend and database in containers, build and run them from the repo root:

```bash
docker compose build
docker compose up
```

To recreate the backend after editing `.env`:

```bash
docker compose up -d --build --force-recreate backend
```

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

If you are using Docker for the backend, start it with `docker compose up` instead and keep the frontend separate unless you also containerize it.

Press `Ctrl+C` in that terminal to stop both.

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
