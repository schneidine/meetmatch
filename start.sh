#!/usr/bin/env bash
# MeetMatch – start backend and frontend together
# Usage: ./start.sh

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV="$ROOT_DIR/.venv"
BACKEND_DIR="$ROOT_DIR/meetmatch_backend"
FRONTEND_DIR="$ROOT_DIR/frontend/meetmatch_frontend"

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
echo "→ Starting Django backend on http://127.0.0.1:8000 ..."
(cd "$BACKEND_DIR" && python manage.py runserver 127.0.0.1:8000) &
BACKEND_PID=$!

# ── start React frontend ───────────────────────────────────────────────────────
echo "→ Starting React frontend on http://localhost:3000 ..."
(cd "$FRONTEND_DIR" && npm start) &
FRONTEND_PID=$!

# ── clean up both processes on Ctrl-C / exit ──────────────────────────────────
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
}
trap cleanup INT TERM EXIT

echo ""
echo "Both servers are running. Press Ctrl+C to stop."
wait
