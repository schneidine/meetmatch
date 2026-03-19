# MeetMatch

Friend-matching app and event aggregator built with:

- Django (backend API)
- PostgreSQL + PostGIS (database)
- React (frontend)

## Project Structure

- `meetmatch_backend/` - Django backend
- `frontend/meetmatch_frontend/` - React frontend
- `start.sh` - starts backend and frontend together

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

Create a file at `meetmatch_backend/.env`:

```env
DATABASE_NAME=meetmatch
DATABASE_PASSWORD=your_postgres_password
ENVIRONMENT=local
```

## Install Dependencies

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
