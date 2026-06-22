#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "Installing dependencies..."
if command -v uv &> /dev/null; then
  uv pip install -r requirements.txt
else
  pip install -r requirements.txt
fi

echo ""
echo "Starting forecast service on port ${FORECAST_PORT:-8000}..."
echo "Model will download ~400MB on first run. Wait for 'Model loaded in' message."
exec python main.py
