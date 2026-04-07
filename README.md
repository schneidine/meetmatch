# MeetMatch

Friend-matching app and event aggregator built with:

- Django (backend API)
- PostgreSQL + PostGIS (database)
- React (frontend)

The backend can run either locally or in Docker. For Docker-specific setup, see [DOCKER.md](DOCKER.md).

## Project Structure

- `meetmatch_backend/` - Django backend
- `frontend/meetmatch_frontend/` - React frontend
- `start.sh` - starts backend and frontend together

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

### Frontend

```bash
cd frontend/meetmatch_frontend
npm install
cd ../..
```

## Run the App (One Command)

From the repo root:

```bash
./start.sh
```

This starts:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://localhost:3000`

If you are using Docker for the backend, start it with `docker compose up` instead and keep the frontend separate unless you also containerize it.

Press `Ctrl+C` in that terminal to stop both.

## API Endpoints (Current)

- `POST /api/signup/`
- `POST /api/login/`

Sample signup body:

```json
{
	"username": "Jane.D",
	"email": "jane@example.com",
	"age": 20,
	"password": "your-password",
	"location": "Orlando, FL"
}
```

Sample login body:

```json
{
	"username": "Jane.D",
	"password": "your-password"
}
```

`username` also accepts email for login.

## Database Notes

- Django uses custom user model: `users.User`
- Main user table: `users_user`
- Database defaults to `meetmatch` unless overridden in `.env`

For full setup details, see [meetmatch_backend/database_setup.md](meetmatch_backend/database_setup.md).

## Common Commands

Backend checks/migrations:

```bash
source .venv/bin/activate
cd meetmatch_backend
python manage.py check
python manage.py migrate
```

Frontend scripts:

```bash
cd frontend/meetmatch_frontend
npm start
npm test
npm run build
```
