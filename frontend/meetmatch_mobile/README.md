# MeetMatch Mobile (Expo)

This is the primary frontend for MeetMatch.

## Documentation

- [Mobile Folder Structure & Page Access](MOBILE_FOLDER_STRUCTURE.md)

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npm start
   ```

## Running on Different Platforms

### Web (Browser)
```bash
npm run web
```

### iOS Simulator
```bash
npm run ios
```
**Note:** You need Xcode and a simulator booted. See troubleshooting below.

### Android Emulator
```bash
npm run android
```

### Physical Device (with Expo Go)
```bash
npm start
```
Scan the QR code with your phone's camera (iOS) or press the camera icon in Expo Go (Android).

## API Backend Configuration

**The default backend URL is auto-detected in Expo dev mode** from the Metro host IP (port `8000`).

**Important:** Do not run your Django backend on `8081` while using Expo. Port `8081` is used by Expo Metro bundler.

### For Simulator/Emulator (iOS/Android)
- The auto-detected URL should work if your backend is running and you're on the same network.
- If it doesn't work, go to **API Settings** (on login screen) and enter your Mac's LAN IP.

### To find your Mac's LAN IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1
```
Then use `http://<your-ip>:8000` in API Settings.

### For Physical Device
1. Find your Mac's LAN IP (see above).
2. Tap **API Settings** on the login screen.
3. Enter `http://<your-mac-lan-ip>:8000` and save.

### Environment Variable (Alternative)
Set before starting:
```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000 npm start
```

## Current Features

- Login screen with password show/hide
- Signup screen with password show/hide
- Post-signup interests onboarding:
   - Select interests
   - Select top 3
   - Save to backend
- Main app after auth/onboarding:
   - Swipeable pages: Matches, Events, Profile
   - Bottom navigation band for Matches/Events/Profile
- Profile page:
   - Edit location and radius (barebones local save)
   - Edit interests (preloads saved interest toggles)
   - API settings shortcut
   - Logout

## Backend Endpoints Used

- `POST /api/login/`
- `POST /api/signup/`
- `GET /api/interests/`
- `GET /api/users/<user_id>/interests/`
- `POST /api/users/<user_id>/interests/`

## Troubleshooting

### iOS Simulator: "No iOS devices available"
```bash
# Boot simulator manually
xcrun simctl boot "iPhone 15"

# Or open Xcode's simulator app
open -a Simulator

# Then run
npm run ios
```

### Emulator not starting on Android
- Ensure Android Studio is installed with SDK tools.
- Create a virtual device in Android Studio's AVD Manager.
- Boot it before running `npm run android`.

### API connection fails on native
- Check your Mac's firewall (System Preferences → Security & Privacy).
- Ensure backend is running on `8000`.
- Use **API Settings** to update the URL to your Mac's current LAN IP.
