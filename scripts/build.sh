#!/usr/bin/env bash
set -euo pipefail

# Production build into dist/.
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if [ ! -d node_modules ]; then
  npm install
fi

npm run build
