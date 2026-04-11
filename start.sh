#!/usr/bin/env bash
# MeetMatch – start backend and mobile together
# Usage: ./start.sh [ios|android|web]
# Optional env: LAN_IP / EXPO_PUBLIC_LAN_IP, API_PORT / EXPO_PUBLIC_API_PORT

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT_DIR/.venv"
BACKEND_DIR="$ROOT_DIR/meetmatch_backend"
MOBILE_DIR="$ROOT_DIR/frontend/meetmatch_mobile"
MODE="${1:-interactive}"
BACKEND_PID=""

HOST_IP="${LAN_IP:-${EXPO_PUBLIC_LAN_IP:-}}"
if [ -z "$HOST_IP" ]; then
  HOST_IP="$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)"
fi
if [ -z "$HOST_IP" ]; then
  HOST_IP="127.0.0.1"
fi

API_PORT="${API_PORT:-${EXPO_PUBLIC_API_PORT:-8000}}"
API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-http://$HOST_IP:$API_PORT}"

case "$MODE" in
  ios)
    FRONTEND_CMD=(npm run ios)
    ;;
  android)
    FRONTEND_CMD=(npm run android)
    ;;
  web)
    FRONTEND_CMD=(npm run web)
    ;;
  interactive|start|"")
    FRONTEND_CMD=(npm start)
    ;;
  -h|--help)
    echo "Usage: ./start.sh [ios|android|web]"
    echo ""
    echo "No argument starts Expo in interactive mode so you can press:"
    echo "  i = open iOS simulator"
    echo "  a = open Android emulator"
    echo "  w = open web"
    echo ""
    echo "Optional env overrides:"
    echo "  LAN_IP=192.168.x.x API_PORT=8000 ./start.sh android"
    echo "  EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000 ./start.sh"
    exit 0
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: ./start.sh [ios|android|web]"
    exit 1
    ;;
esac

cleanup() {
  echo ""
  echo "Shutting down..."
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup INT TERM EXIT

# ── activate virtual environment ──────────────────────────────────────────────
if [ -f "$VENV/bin/activate" ]; then
  source "$VENV/bin/activate"
else
  echo "ERROR: virtual environment not found at $VENV"
  echo "Create one with: python3 -m venv .venv && source .venv/bin/activate && pip install -r meetmatch_backend/requirements.txt"
  exit 1
fi

# ── install / sync backend dependencies ───────────────────────────────────────
echo "→ Installing backend dependencies..."
pip install -q -r "$BACKEND_DIR/requirements.txt"

# ── start / reuse Django backend ──────────────────────────────────────────────
if lsof -nP -iTCP:"$API_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "→ Backend already running on $API_BASE_URL — reusing existing server."
else
  echo "→ Starting Django backend on $API_BASE_URL ..."
  (cd "$BACKEND_DIR" && python manage.py runserver 0.0.0.0:"$API_PORT") &
  BACKEND_PID=$!
fi

# ── start Expo mobile in foreground so keyboard input works ──────────────────
echo "→ Starting Expo mobile (API: $API_BASE_URL) ..."
echo "→ Mode: $MODE"
if [ "$MODE" = "interactive" ] || [ "$MODE" = "start" ]; then
  echo "→ Expo input is enabled here: press i for iOS, a for Android, w for web."
fi
cd "$MOBILE_DIR"
EXPO_PUBLIC_LAN_IP="$HOST_IP" \
EXPO_PUBLIC_API_PORT="$API_PORT" \
EXPO_PUBLIC_API_BASE_URL="$API_BASE_URL" \
"${FRONTEND_CMD[@]}"
