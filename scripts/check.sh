#!/usr/bin/env bash
set -euo pipefail

# Run unit tests, lint, and typecheck.
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if [ ! -d node_modules ]; then
  npm install
fi

npm test
npm run lint
npx tsc -b
