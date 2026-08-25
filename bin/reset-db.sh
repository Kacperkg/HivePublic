#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"
printf "This removes the local PostgreSQL volume. Type 'reset' to continue: "
read -r answer
if [ "$answer" != "reset" ]; then
  echo "Database reset cancelled."
  exit 0
fi
docker compose down --volumes
exec docker compose up --build
