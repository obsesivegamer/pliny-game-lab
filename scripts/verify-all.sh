#!/usr/bin/env bash
set -eo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== [1/3] Doctor: Checking HTTP Server ==="
if curl -s -I http://localhost:8000/ | grep -q "200 OK"; then
  echo "✓ Server is responding on http://localhost:8000"
else
  echo "✗ Server is not responding on http://localhost:8000. Start it with: python3 -m http.server 8000"
  exit 1
fi

echo "=== [2/3] Syntax Integrity Checks ==="
node --check src/core/hub.js
node --check src/demos/vesuvius/vesuvius.js
node --check src/demos/bestiarium/bestiarium.js
node --check src/demos/cosmographia/cosmographia.js
node --check src/demos/mechanica/mechanica.js
node --check src/demos/labyrinthus/audio.js
node --check src/demos/labyrinthus/labyrinthus.js
echo "✓ All ES modules pass syntax checks"

echo "=== [3/3] Engine Simulation Execution Tests ==="
node tests/verify-engines.js
echo "✓ All 5 engines simulated successfully"

mkdir -p .audit
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Verification PASSED: All 5 engines verified green" >> .audit/verification.log
echo "Proof recorded in .audit/verification.log"
