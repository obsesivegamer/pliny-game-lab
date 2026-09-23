import '../../../tests/vesuvius-gameplay.js';
import { VesuviusEngine as Baseline, ELEMENT } from '../../../src/demos/vesuvius/vesuvius-baseline.mjs';
import { VesuviusEngine as Treatment } from '../../../src/demos/vesuvius/vesuvius.js';

function engine(Type) {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const game = new Type(canvas, canvas.getContext('2d'), document.createElement('div'));
  game.resize(800, 600, 1);
  return game;
}

function sand(Type, fps) {
  const game = engine(Type);
  game.setPlayMode('sandbox');
  game.grid.fill(ELEMENT.EMPTY);
  game.heat.fill(0);
  game.visited.fill(0);
  game.bombs = [];
  game.bombFragments = [];
  game.pdcs = [];
  game.plumeParticles = [];
  game.lightningBolts = [];
  game.shockwaves = [];
  game.chamberPressure = 0;
  game.currentPhase = 0;
  game.targetPlumeKm = 0;
  game.plumeHeightKm = 0;
  game.simWidth = 5;
  game.cellCount = 5 * 180;
  game.grid = new Uint8Array(game.cellCount);
  game.heat = new Float32Array(game.cellCount);
  game.visited = new Uint8Array(game.cellCount);
  game.pressure = new Float32Array(game.cellCount);
  game.elevationMap = new Int16Array(5).fill(180);
  game.grid[10 * game.simWidth + 2] = ELEMENT.SAND;
  for (let i = 0; i < fps; i++) game.update(1 / fps);
  let row = -1;
  for (let y = 0; y < game.simHeight; y++) {
    if (game.grid[y * game.simWidth + 2] === ELEMENT.SAND) row = y;
  }
  game.destroy();
  return row;
}

function fleet(Type) {
  const game = engine(Type);
  game.selectShip(0);
  game.orderSelectedShip(252);
  for (let i = 0; i < 270; i++) game.update(1 / 60);
  const state = {
    time: game.time,
    missionTime: game.mission.time,
    phase: game.currentPhase,
    ship: {
      x: game.fleet[0].x,
      y: game.fleet[0].y,
      cargo: game.fleet[0].cargo,
      health: game.fleet[0].health,
      state: game.fleet[0].state
    },
    rescued: game.mission.rescued,
    civilians: game.mission.civiliansAtStabiae
  };
  game.destroy();
  return state;
}

console.log('BASELINE_SAND', JSON.stringify(Object.fromEntries([30, 60, 120].map(fps => [fps, sand(Baseline, fps)]))));
console.log('TREATMENT_SAND', JSON.stringify(Object.fromEntries([30, 60, 120].map(fps => [fps, sand(Treatment, fps)]))));
console.log('BASELINE_FLEET_270', JSON.stringify(fleet(Baseline)));
console.log('TREATMENT_FLEET_270', JSON.stringify(fleet(Treatment)));
