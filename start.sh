#!/usr/bin/env bash
# MeetMatch – start backend and mobile together
# Usage: ./start.sh

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT_DIR/.venv"
BACKEND_DIR="$ROOT_DIR/meetmatch_backend"
MOBILE_DIR="$ROOT_DIR/frontend/meetmatch_mobile"

HOST_IP="$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)"
if [ -z "$HOST_IP" ]; then
  HOST_IP="127.0.0.1"
fi
API_BASE_URL="http://$HOST_IP:8000"

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

# ── start Django backend ───────────────────────────────────────────────────────
echo "→ Starting Django backend on $API_BASE_URL ..."
(cd "$BACKEND_DIR" && python manage.py runserver 0.0.0.0:8000) &
BACKEND_PID=$!

# ── start Expo mobile ──────────────────────────────────────────────────────────
echo "→ Starting Expo mobile (API: $API_BASE_URL) ..."
(cd "$MOBILE_DIR" && EXPO_PUBLIC_API_BASE_URL="$API_BASE_URL" npm start) &
MOBILE_PID=$!

# ── clean up both processes on Ctrl-C / exit ──────────────────────────────────
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$BACKEND_PID" "$MOBILE_PID" 2>/dev/null
  wait "$BACKEND_PID" "$MOBILE_PID" 2>/dev/null
}
trap cleanup INT TERM EXIT

echo ""
echo "Backend + mobile are running. Press Ctrl+C to stop."
wait
