#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
VENV=".venv-monte-carlo"
if [[ ! -d "$VENV" ]]; then
  python3 -m venv "$VENV"
fi
source "$VENV/bin/activate"
pip install --upgrade pip >/dev/null
pip install -r requirements.txt >/dev/null
python monte_carlo.py --config config.json "$@"
