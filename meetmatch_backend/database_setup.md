# MeetMatch Database Setup Guide

This guide explains how to set up the PostgreSQL/PostGIS database for the MeetMatch project.

## 1. Install Dependencies

- Install Python 3.13 or higher.
- Install PostgreSQL and PostGIS.
- Install GDAL and GEOS (for spatial features):
  - On macOS: `brew install postgis gdal geos`
- Install pgAdmin (optional, for GUI management).

## 2. Create a Python Virtual Environment

```
python -m venv venv
source venv/bin/activate
```

## 3. Install Python Packages

```
pip install -r requirements.txt
```

## 4. Create the Database

- Open pgAdmin or use the terminal:
  - In pgAdmin: Right-click "Databases" → "Create" → "Database", enter the name (e.g., `meetmatch_db`), and click "Save".
  - In terminal:
    ```
    createdb -U postgres meetmatch_db
    ```

## 5. Configure .env File

Create a `.env` file in `meetmatch_backend/` with:
```
DATABASE_PASSWORD=your_postgres_password
DATABASE_NAME=meetmatch_db
ENVIRONMENT=local
DEBUG=True
```

## 6. Update settings.py

- Make sure `settings.py` uses environment variables for database config.
- Set `AUTH_USER_MODEL = 'users.User'` if using a custom user model.
- Add `'users'`, `'events'`, `'matching'` to `INSTALLED_APPS`.
- Set `GDAL_LIBRARY_PATH` and `GEOS_LIBRARY_PATH` if needed:
```
GDAL_LIBRARY_PATH = '/opt/homebrew/lib/libgdal.dylib'
GEOS_LIBRARY_PATH = '/opt/homebrew/lib/libgeos_c.dylib'
```

## 7. Run Migrations

```
python manage.py makemigrations
python manage.py migrate
```

## 8. Connect with pgAdmin

- Host: `localhost`
- Port: `5432`
- Username: `postgres`
- Password: from `.env`
- Database: from `.env` (e.g., `meetmatch_db`)

## 9. Troubleshooting

- If you get errors about missing libraries, check GDAL and GEOS installation and paths.
- If database does not exist, create it as shown above.
- If custom user model errors, set `AUTH_USER_MODEL` in `settings.py`.

---

This guide ensures your database is ready for Django/PostGIS development. For further help, ask your team or consult the README.
