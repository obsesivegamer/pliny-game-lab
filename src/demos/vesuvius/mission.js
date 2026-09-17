/**
 * Evacuate Stabiae — mission state for Vesuvius gameplay.
 *
 * Named data shape:
 *   Mission = {
 *     mode: 'gameplay' | 'sandbox',
 *     status: 'playing' | 'won' | 'lost',
 *     loseReason: null | 'fleet' | 'town' | 'caldera',
 *     rescued, civiliansAtStabiae, quota, objective,
 *     selectedShip, tool, ventCharges, barrierCharges, ventDelay, time
 *   }
 *
 * Win: rescued >= quota while still playing.
 * Lose: fleet sunk, Stabiae emptied, or caldera before the quota.
 * Sandbox never resolves.
 */

export const MODE = {
  GAMEPLAY: 'gameplay',
  SANDBOX: 'sandbox'
};

export const STATUS = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost'
};

export const LOSE_REASON = {
  FLEET: 'fleet',
  TOWN: 'town',
  CALDERA: 'caldera'
};

export const TOOL = {
  ORDER: 'order',
  BARRIER: 'barrier',
  PAINT: 'paint'
};

export const OBJECTIVE =
  'Rescue 90 citizens from Stabiae before a pyroclastic surge or caldera collapse kills the bay.';

export const READABILITY = {
  galleySimLengthFlagship: 21,
  galleySimLength: 17,
  galleyDesignedFlagship: 48,
  galleyDesigned: 38,
  galleyHitRadius: 18,
  galleyBayGap: 24,
  galleyBayMargin: 8,
  plumeCap: 720,
  plumeSpawnPerKm: 0.38,
  fragmentCap: 70,
  bayCullMargin: 10,
  bayCullYFrac: 0.62
};

export function galleyDrawScale(scaleX, isFlagship, gameplay) {
  if (!gameplay) return 1;
  const designed = isFlagship ? READABILITY.galleyDesignedFlagship : READABILITY.galleyDesigned;
  const simLen = isFlagship ? READABILITY.galleySimLengthFlagship : READABILITY.galleySimLength;
  const world = (simLen / designed) * Math.max(0.001, scaleX);
  return Math.max(world, scaleX * 0.42);
}

export const MISSION_NUMBERS = {
  rescueQuota: 90,
  startingCivilians: 160,
  ventCharges: 3,
  barrierCharges: 4,
  shipCapacity: 36,
  pickupRate: 7.5,
  offloadRate: 14,
  pdcCivilianKillRate: 22,
  pdcShipDamageRate: 32,
  pumiceShipDamageRate: 6,
  ventDelaySec: 10,
  ventPressureBleed: 18,
  pickupRadius: 16,
  offloadRadius: 18,
  stabiaeX: 215,
  offloadX: 198,
  shipHitRadius: 14,
  pdcTownRadius: 22,
  pdcShipRadius: 14,
  sailSpeed: 7.2
};

export const PHASE_SCHEDULE = [
  { at: 0, phase: 0 },
  { at: 7, phase: 1 },
  { at: 16, phase: 2 },
  { at: 26, phase: 3 },
  { at: 38, phase: 4 },
  { at: 52, phase: 5 },
  { at: 72, phase: 6 }
];

export function createMission(mode = MODE.GAMEPLAY) {
  return {
    mode,
    status: STATUS.PLAYING,
    loseReason: null,
    rescued: 0,
    civiliansAtStabiae: MISSION_NUMBERS.startingCivilians,
    selectedShip: null,
    ventCharges: MISSION_NUMBERS.ventCharges,
    barrierCharges: MISSION_NUMBERS.barrierCharges,
    ventDelay: 0,
    time: 0,
    tool: mode === MODE.SANDBOX ? TOOL.PAINT : TOOL.ORDER,
    objective: OBJECTIVE,
    quota: MISSION_NUMBERS.rescueQuota
  };
}

export function scheduledPhase(time, ventDelay = 0) {
  let phase = PHASE_SCHEDULE[0].phase;
  for (const step of PHASE_SCHEDULE) {
    if (time >= step.at + ventDelay) phase = step.phase;
  }
  return phase;
}

export function tryVent(mission) {
  if (mission.mode !== MODE.GAMEPLAY || mission.status !== STATUS.PLAYING) {
    return { ok: false, reason: 'inactive' };
  }
  if (mission.ventCharges <= 0) {
    return { ok: false, reason: 'no-charges' };
  }
  mission.ventCharges -= 1;
  mission.ventDelay += MISSION_NUMBERS.ventDelaySec;
  return {
    ok: true,
    delay: MISSION_NUMBERS.ventDelaySec,
    bleed: MISSION_NUMBERS.ventPressureBleed
  };
}

export function trySpendBarrier(mission) {
  if (mission.mode !== MODE.GAMEPLAY || mission.status !== STATUS.PLAYING) {
    return { ok: false, reason: 'inactive' };
  }
  if (mission.barrierCharges <= 0) {
    return { ok: false, reason: 'no-charges' };
  }
  mission.barrierCharges -= 1;
  return { ok: true };
}

export function pdcHitsX(pdcs, x, radius) {
  for (const p of pdcs) {
    if (!p || p.alive === false) continue;
    if (Math.abs(p.x - x) <= radius) return true;
  }
  return false;
}

export function applyWorldHazards(mission, world, dt) {
  if (mission.mode !== MODE.GAMEPLAY || mission.status !== STATUS.PLAYING) return;
  const pdcs = world.pdcs || [];
  const ships = world.ships || [];
  const n = MISSION_NUMBERS;

  if (pdcHitsX(pdcs, n.stabiaeX, n.pdcTownRadius) || (world.phase || 0) >= 6) {
    const rate = (world.phase || 0) >= 6 ? n.pdcCivilianKillRate * 2.4 : n.pdcCivilianKillRate;
    mission.civiliansAtStabiae = Math.max(0, mission.civiliansAtStabiae - rate * dt);
  }

  for (const ship of ships) {
    if (!ship || ship.alive === false) continue;
    if (pdcHitsX(pdcs, ship.x, n.pdcShipRadius)) {
      ship.health = Math.max(0, (ship.health ?? 100) - n.pdcShipDamageRate * dt);
    }
    if (ship.health <= 0) {
      ship.alive = false;
      ship.state = 'sunk';
    }
  }
}

export function resolveMission(mission, world) {
  if (mission.mode !== MODE.GAMEPLAY || mission.status !== STATUS.PLAYING) return mission;

  if (mission.rescued >= mission.quota) {
    mission.status = STATUS.WON;
    mission.loseReason = null;
    return mission;
  }

  const ships = world.ships || [];
  const living = ships.filter((s) => s && s.alive !== false && (s.health ?? 0) > 0);
  if (ships.length > 0 && living.length === 0) {
    mission.status = STATUS.LOST;
    mission.loseReason = LOSE_REASON.FLEET;
    return mission;
  }

  const cargoAfloat = living.reduce((sum, s) => sum + (s.cargo || 0), 0);
  if (mission.civiliansAtStabiae <= 0 && cargoAfloat <= 0) {
    mission.status = STATUS.LOST;
    mission.loseReason = LOSE_REASON.TOWN;
    return mission;
  }

  if ((world.phase || 0) >= 6) {
    mission.status = STATUS.LOST;
    mission.loseReason = LOSE_REASON.CALDERA;
    return mission;
  }

  return mission;
}

export function threatMeter(mission, phase = 0, pdcNearTown = false) {
  const civilianLoss = 1 - mission.civiliansAtStabiae / Math.max(1, MISSION_NUMBERS.startingCivilians);
  const phaseTerm = Math.max(0, Math.min(1, phase / 6));
  const pdcTerm = pdcNearTown ? 0.22 : 0;
  const value = phaseTerm * 0.55 + civilianLoss * 0.23 + pdcTerm;
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function clampShipX(x, waterlineX, simWidth) {
  const minX = waterlineX + 3;
  const maxX = simWidth - 10;
  return Math.max(minX, Math.min(maxX, x));
}
