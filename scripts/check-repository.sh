#!/bin/sh
set -eu
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repo_root"

tracked_env=$(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' || true)
if [ -n "$tracked_env" ]; then
  echo "Tracked environment files found:" >&2
  echo "$tracked_env" >&2
  exit 1
fi

tracked_generated=$(git ls-files | grep -E '(^|/)(node_modules|dist|coverage|\.expo)/' || true)
if [ -n "$tracked_generated" ]; then
  echo "Tracked generated files found:" >&2
  echo "$tracked_generated" >&2
  exit 1
fi

if git grep -n -E 'AIza[0-9A-Za-z_-]{20,}|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|/Users/[^/]+/' -- ':!scripts/check-repository.sh'; then
  echo "Potential secret or local path found." >&2
  exit 1
fi

echo "Repository hygiene checks passed."
