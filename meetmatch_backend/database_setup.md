# MeetMatch Database Setup Guide

This guide explains how to set up PostgreSQL/PostGIS for the MeetMatch backend (`meetmatch_backend/`).

## 1. Install Dependencies

- Python 3.13+
- PostgreSQL + PostGIS
- GDAL + GEOS (required for geospatial fields)
  - macOS: `brew install postgis gdal geos`
- pgAdmin (optional)

## 2. Create/Activate Virtual Environment

From repo root:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

## 3. Install Backend Packages

```bash
cd meetmatch_backend
pip install -r requirements.txt
```

## 4. Create Database

Default project DB name is `meetmatch`.

Terminal example:

```bash
createdb -U postgres meetmatch
```

Or create with pgAdmin using the same name.

## 5. Configure Environment Variables

Create `meetmatch_backend/.env`:

```env
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=meetmatch
ENVIRONMENT=local
DEBUG=True
```

## 6. Optional macOS Spatial Library Paths

If Django cannot find GDAL/GEOS, set these in `config/settings.py`:

```python
GDAL_LIBRARY_PATH = '/opt/homebrew/lib/libgdal.dylib'
GEOS_LIBRARY_PATH = '/opt/homebrew/lib/libgeos_c.dylib'
```

## 7. Run Migrations

```bash
cd meetmatch_backend
python manage.py migrate
```

## 8. Quick Verification

```bash
python manage.py check
```

## 9. Connect in pgAdmin

- Host: `localhost`
- Port: `5432`
- Username: `postgres`
- Password: from `.env`
- Database: `meetmatch`

## Notes for Current App Flow

- Backend powers a mobile-first Expo frontend (`frontend/meetmatch_mobile`).
- Interests are stored as selected interests + top interests (top 3).
- Core user/auth/interests endpoints are documented in the root `README.md`.

## Troubleshooting

- Missing GDAL/GEOS: verify installation and library paths.
- DB not found: create it first (`createdb -U postgres meetmatch`).
- Migration issues: ensure `.env` values are correct and virtualenv is active.
