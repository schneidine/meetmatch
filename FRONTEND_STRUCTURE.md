# Frontend Structure

Frontend root: `frontend/meetmatch_frontend/`

## High-level Layout

- `package.json` - React app dependencies/scripts (`react-scripts`)
- `public/` - static public assets/template HTML
- `src/` - application source code
- `build/` - production build output (generated)

## `src/` File Breakdown

- `main.jsx` / `index.js`
  - React app bootstrap and render entry
- `App.jsx`
  - top-level component
  - currently renders `Login`
- `Login.jsx` + `Login.css`
  - login form UI and state
  - submits to backend `POST http://127.0.0.1:8000/api/login/`
  - displays loading, success, and error states
- `Signup.jsx` + `Signup.css`
  - signup form UI and state
  - submits to backend `POST http://127.0.0.1:8000/api/signup/`
  - sends `username`, `email`, `age`, `password`, `location`
  - location supports natural text (e.g., "Orlando, FL") for backend geocoding
- `App.css`, `index.css`
  - global/component styling
- `App.test.js`, `setupTests.js`
  - React Testing Library setup/tests
- `reportWebVitals.js`
  - performance metrics helper

## Frontend Runtime Flow

1. User enters credentials in `Login.jsx` or registration details in `Signup.jsx`.
2. Form submits JSON payload to Django API endpoints under `/api/`.
3. UI updates from backend response (`message` / `error`).

## NPM Scripts

- `npm start` - starts dev server (`localhost:3000`)
- `npm run build` - creates production bundle
- `npm test` - runs tests
- `npm run eject` - ejects CRA configuration
