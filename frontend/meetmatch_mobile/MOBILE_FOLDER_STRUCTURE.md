# MeetMatch Mobile Folder & Page Access Guide

This document explains what is in `frontend/meetmatch_mobile/` and where each page is accessed.

## Folder Contents (What matters now)

- `app/`
  - Expo Router routes and screen entry files.
- `app/index.tsx`
  - **Primary app implementation** (current app flow).
  - Handles login, signup, interests, settings, and main swipe tabs through local screen state.
- `app/_layout.tsx`
  - Root router layout (`Stack`) with header hidden.
- `assets/`
  - Static images/fonts used by mobile app.
- `components/`, `constants/`, `hooks/`
  - Reusable Expo template/helper files.
  - Some files are currently not used by the active `app/index.tsx` flow.
- `app/(tabs)/` and `app/modal.tsx`
  - Expo template routes from starter scaffold.
  - **Not used** by the current single-route mobile flow.
- `app.json`
  - Expo app config.
- `package.json`
  - Scripts/dependencies (`npm start`, `npm run ios`, `npm run android`, `npm run web`).
- `.env.example`
  - API base URL example (`EXPO_PUBLIC_API_BASE_URL`).

## Route Access (URL/Path)

Current router setup uses one active route:

- `/` → `app/index.tsx`

So all screens below are rendered from `app/index.tsx` (via state), not separate file routes.

## In-App Page Access (Inside `app/index.tsx`)

### Auth & Setup Screens

- `login`
  - Initial screen.
  - Access: app launch, logout, or back from settings.
- `signup`
  - Access: `New to account? Sign up` from login.
- `interests`
  - Access:
    - automatically after successful signup,
    - from Profile via `Edit Interests`.
- `settings`
  - Access:
    - from login via `API Settings`,
    - from Profile via `API Settings`.

### Main App Screen (`main`)

After login (or after saving interests), user is directed to `main`.

Inside `main`, horizontal swipe + bottom nav tabs are available in this order:

1. `chat` (left-most)
2. `matches`
3. `events` (default landing tab)
4. `profile` (right-most)

## Current Navigation Flow

- Login success → `main` (default tab: Events)
- Signup success → `interests`
- Save interests success → `main` (default tab: Events)
- Profile `Log Out` → `login`

## Run & Test

From `frontend/meetmatch_mobile`:

```bash
npm start
npm run ios
npm run android
npm run web
```
