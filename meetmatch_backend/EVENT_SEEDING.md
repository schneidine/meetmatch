# Event Test Data Seeding

If you want sample events to appear in the app or in pgAdmin, run the event seed command against your **real local database**.

## Command

From the repo root:

```bash
source .venv/bin/activate
cd meetmatch_backend
python manage.py seed_events
```

## What this does

- creates sample MeetMatch events
- links them to interest categories
- stores them in your local PostgreSQL/PostGIS database

## Verify in pgAdmin

Look in:

- database: `meetmatch`
- schema: `public`
- table: `events_event`

You can also verify with SQL:

```sql
SELECT COUNT(*) FROM events_event;
```

## Important note

Running:

```bash
python manage.py test events
```

uses a temporary **test database**, so those rows will **not** stay in your normal local database.
