# Docker Guide

Use Docker so you do not need to install Postgres, PostGIS, or run the backend directly on your machine. The container setup gives you a repeatable local environment that matches the backend config in this repo.

## What You Need

1. Docker Desktop installed and running.
2. A root `.env` file copied from `.env.example`.

## Step 1: Set Up `.env`

Copy `.env.example` to `.env` in the repo root and fill in your values.

Example:

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

Keep `.env` local only. Do not commit it.

## Step 2: Build the Containers

From the repo root, run:

```bash
docker compose build
```

This builds the backend image and installs the Python dependencies.

## Step 3: Start the App

Run:

```bash
docker compose up
```

If you want it detached in the background, use:

```bash
docker compose up -d
```

## Step 4: Recreate the Backend After Env Changes

If you edit `.env`, restart the backend so it picks up the new values:

```bash
docker compose up -d --build --force-recreate backend
```

## Step 5: Run Backend Commands

Use these commands when you want to check or test the backend inside Docker:

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py fetch_events
```

## Step 6: Check That the Backend Sees Your Env Vars

You can verify that the Eventbrite token is loaded without printing it:

```bash
docker compose exec backend python -c "import os; print('EVENTBRITE_API_KEY: set' if os.getenv('EVENTBRITE_API_KEY') else 'EVENTBRITE_API_KEY: missing')"
```

## Important Notes

- The backend uses `DATABASE_HOST=db` inside Docker. Do not use `localhost` for the database container.
- `DJANGO_SECRET_KEY` should stay out of git.
- `EVENTBRITE_API_KEY` is required for the Eventbrite fetch command.
- `docker-compose.yml` is fine to commit, but never put real secrets directly in it.

## When to Use Docker

Use Docker when you want a quick local backend setup without installing PostgreSQL and PostGIS manually. Use the regular local Python setup if you prefer running the backend outside containers.