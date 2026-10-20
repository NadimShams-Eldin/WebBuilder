#!/usr/bin/env bash
set -euo pipefail

# Start the Vite development server on all interfaces.
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if [ ! -d node_modules ]; then
  npm install
fi

npm run dev -- --host
