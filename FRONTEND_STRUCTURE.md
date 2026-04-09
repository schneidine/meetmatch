# Frontend Structure

Frontend root: `frontend/`

## Primary Frontend (Expo Mobile)

Primary app: `frontend/meetmatch_mobile/`

### High-level Layout

- `package.json` - Expo dependencies/scripts
- `app/index.tsx` - main app screen and navigation logic
- `app/_layout.tsx` - Expo Router layout
- `.env.example` - API base URL example

### Current Mobile UX

- Auth screens: Login, Signup
- Post-signup onboarding: Interests + Top 3 interests
- Main app shell (after auth/onboarding):
  - Matches page (left)
  - Events page (center/default)
  - Profile page (right)
- Horizontal swipe between pages + bottom tab band

### Profile Features (Current)

- View basic user info
- Edit location (prefilled with saved value)
- Edit radius
- Edit interests (opens interests screen with preselected toggles)
- API settings access
- Logout

### API Usage (Mobile)

- `POST /api/signup/`
- `POST /api/login/`
- `GET /api/interests/`
- `GET /api/users/<user_id>/interests/`
- `POST /api/users/<user_id>/interests/`

### Mobile Scripts

- `npm start` - Expo dev server (Metro)
- `npm run ios` - iOS simulator
- `npm run android` - Android emulator/device
- `npm run web` - Expo web preview

## Secondary Frontend (Legacy CRA Web)

Secondary app: `frontend/meetmatch_frontend/`

- Retained as fallback / legacy web client
- Uses Create React App (`react-scripts`)
- Not the primary active frontend for current development
