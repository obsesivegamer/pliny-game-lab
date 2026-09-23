#!/usr/bin/env bash
set -eo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
BASE_URL="${PLINY_BASE_URL:-http://localhost:8000}"

echo "=== [1/4] Doctor: Checking HTTP Server ==="
if curl -s -I "$BASE_URL/" | grep -q "200 OK"; then
  echo "✓ Server is responding on $BASE_URL"
else
  echo "✗ Server is not responding on $BASE_URL. Start a local server from the repository root."
  exit 1
fi

echo "=== [2/4] Syntax Integrity Checks ==="
node --check src/core/hub.js
node --check src/core/sound.js
node --check src/core/puzzle.js
for source in src/demos/{oracle_words,canal_lines,stonefall,lantern_push,mirror_harbor,mosaic_clues,harbor_jam,star_switch,number_forge,signal_route}/*.js; do
  node --check "$source"
done
node --check src/demos/vesuvius/vesuvius.js
node --check src/demos/vesuvius/mission.js
node --check src/demos/geyser/geyser.js
node --check src/demos/caverna/caverna.js
node --check src/demos/bestiarium/bestiarium.js
node --check src/demos/apis/apis.js
node --check src/demos/cosmographia/cosmographia.js
node --check src/demos/mechanica/mechanica.js
node --check src/demos/labyrinthus/audio.js
node --check src/demos/labyrinthus/labyrinthus.js
echo "✓ All ES modules pass syntax checks"

echo "=== [3/4] Vesuvius gameplay smoke ==="
node tests/vesuvius-gameplay.js
echo "✓ Evacuate Stabiae mission checks passed"

echo "=== [4/4] Engine Simulation Execution Tests ==="
node tests/verify-engines.js
node tests/puzzle-catalog.js
node tests/puzzle-foundation.js
node tests/puzzle-keyboard.js
for suite in tests/{puzzle-logic,star-switch,canal-lines,lantern-push,mirror-harbor,mosaic-clues,harbor-jam,number-forge,signal-route,stonefall}.js; do
  node "$suite"
done
echo "✓ All active catalog engines simulated successfully"

mkdir -p .audit
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Verification PASSED: All active catalog engines verified green" >> .audit/verification.log
echo "Proof recorded in .audit/verification.log"
