# MeetMatch Database Structure

This project uses PostgreSQL with PostGIS via Django (`django.contrib.gis.db.backends.postgis`).

## Database

- Default database name: `meetmatch`
- Engine: PostGIS (PostgreSQL + geospatial extensions)
- Connection source: environment variables in `meetmatch_backend/.env`

## Core Tables

## `users_interest`

Stores interests that can be attached to users and events.

- `id` (PK)
- `name` (varchar(50), unique)

## `users_user`

Custom user table (`AUTH_USER_MODEL = 'users.User'`) extending Django `AbstractUser`.

- `id` (PK)
- `username` (unique, inherited)
- `email` (unique)
- `password` (hashed, inherited)
- `age` (positive integer, nullable)
- `location` (PostGIS `Point`, SRID 4326, nullable)
- `radius` (positive integer, default 10)
- plus inherited Django auth fields (`is_active`, `is_staff`, `last_login`, etc.)
- logical interest relations:
	- selected interests (`interests` M2M)
	- top interests (`top_interests` M2M)

## `events_event`

Event records, including external provider metadata.

- `id` (PK)
- `name` (varchar(100))
- `description` (text, blank allowed)
- `date_time` (datetime)
- `location` (PostGIS `Point`, SRID 4326, nullable)
- `creator_id` (FK -> `users_user.id`)
- `eventbrite_id` (varchar(100), unique, nullable)
- `ticketmaster_id` (varchar(100), unique, nullable)
- `source` (`eventbrite` | `ticketmaster` | `manual`, default `manual`)
- `external_data` (JSON, nullable)
- `last_synced` (datetime, nullable)

## Many-to-Many Join Tables

Django auto-generates join tables for M2M fields:

- `users_user_interests` (`users.User` <-> `users.Interest`)
- `users_user_top_interests` (`users.User` <-> `users.Interest`)
- `users_user_events_interested` (`users.User` <-> `events.Event`)
- `users_user_friend_list` (self-referential user friendships, asymmetrical)
- `events_event_interested_users` (`events.Event` <-> `users.User`)
- `events_event_categories` (`events.Event` <-> `users.Interest`)

## Notes

- Geospatial columns (`location`) require PostGIS extension enabled.
- IDs and auth field details are managed by Django migrations in each app’s `migrations/` folder.
