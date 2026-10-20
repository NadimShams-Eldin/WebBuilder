# Start the Vite development server.
Set-Location (Split-Path $PSScriptRoot -Parent)
if (-not (Test-Path node_modules)) {
  npm install
}
npm run dev -- --host
