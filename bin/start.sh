#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"
if [ ! -f .env ]; then
  echo "Missing .env. Run: cp .env.example .env" >&2
  exit 1
fi
exec docker compose up --build
