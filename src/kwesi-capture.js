/**
 * Kwesi capture / rescue loop — M14 Secretariat and any kwesiMission.
 */

import { dist } from './squad.js';
import { KWESI_ID, KWESI_RESCUE } from './kwesi-mechanics.js';
import { CLERK_ID } from './phase-iv-squad.js';

const SPOT_RANGE_FACTOR = 0.55;
const SPOT_BUILD_SEC = 3.5;
const SPOT_DECAY_RATE = 2;

export function initKwesiCapture(runtime) {
  runtime.kwesiSpotTimer = 0;
  runtime.kwesiExposeTimer = 0;
  runtime.kwesiCaptured = false;
  runtime.kwesiRescued = false;
  runtime.kwesiRescueTimer = 0;
  runtime.kwesiCaptureAnnounced = false;
}

export function findKwesiUnit(state) {
  return state.squadUnits?.find((u) => u.id === KWESI_ID) ?? null;
}

export function isKwesiMission(runtime) {
  return Boolean(runtime?.data?.kwesiMission);
}

function getPlayerPos(state) {
  return {
    x: state.player.body.position.x,
    y: state.player.body.position.y,
  };
}

export function isEnemySpottingKwesi(state, playerPos) {
  if (state.player?.id !== CLERK_ID) return false;
  for (const e of state.enemies) {
    if (e.dead) continue;
    const ex = e.x ?? e.body?.position.x;
    const ey = e.y ?? e.body?.position.y;
    const range = (e.losRadius ?? 175) * SPOT_RANGE_FACTOR;
    if (dist(playerPos, { x: ex, y: ey }) <= range) return true;
  }
  return false;
}

export function captureKwesi(state, runtime) {
  const kwesi = findKwesiUnit(state);
  if (!kwesi || runtime.kwesiCaptured) return false;
  runtime.kwesiCaptured = true;
  runtime.kwesiRescueTimer = runtime.data?.kwesiCapture?.rescueWindowSec ?? KWESI_RESCUE.captureTimerSec;
  kwesi.hp = Math.max(1, kwesi.hp);
  kwesi.captured = true;
  if (state.player?.id === CLERK_ID) {
    const kojoSlot = state.squadUnits.findIndex((u) => u.id === 'kojo');
    if (kojoSlot >= 0) state.playerSlot = kojoSlot;
  }
  return true;
}

export function tryRescueKwesi(state, runtime) {
  if (!runtime.kwesiCaptured || runtime.kwesiRescued) return false;
  const kwesi = findKwesiUnit(state);
  if (!kwesi || state.player?.id === CLERK_ID) return false;
  const kp = { x: kwesi.body.position.x, y: kwesi.body.position.y };
  if (dist(getPlayerPos(state), kp) > 48) return false;
  runtime.kwesiRescued = true;
  runtime.kwesiCaptured = false;
  runtime.kwesiRescueTimer = 0;
  runtime.kwesiSpotTimer = 0;
  runtime.kwesiExposeTimer = 0;
  kwesi.captured = false;
  kwesi.hp = Math.min(kwesi.maxHp ?? 80, (kwesi.hp ?? 40) + 30);
  return true;
}

export function canRescueKwesi(state, runtime) {
  if (!runtime.kwesiCaptured || runtime.kwesiRescued) return false;
  const kwesi = findKwesiUnit(state);
  if (!kwesi || state.player?.id === CLERK_ID) return false;
  const kp = { x: kwesi.body.position.x, y: kwesi.body.position.y };
  return dist(getPlayerPos(state), kp) <= 48;
}

/**
 * @returns {{ captured?: boolean, failed?: boolean, bark?: string }}
 */
export function updateKwesiCapture(state, dt) {
  const rt = state.missionRuntime;
  if (!isKwesiMission(rt) || !state.phaseIvActive) return {};

  const kwesi = findKwesiUnit(state);
  if (!kwesi) return {};

  if (rt.kwesiCaptured && !rt.kwesiRescued) {
    rt.kwesiRescueTimer = Math.max(0, (rt.kwesiRescueTimer ?? 0) - dt);
    if (rt.kwesiRescueTimer <= 0) return { failed: true };
    return { bark: `Rescue Kwesi — ${Math.ceil(rt.kwesiRescueTimer)}s` };
  }

  if (state.player?.id !== CLERK_ID || rt.kwesiCaptured) return {};

  const exposeLimit = rt.data?.kwesiCapture?.exposeSec ?? KWESI_RESCUE.captureTimerSec;
  const pos = getPlayerPos(state);
  if (isEnemySpottingKwesi(state, pos)) {
    rt.kwesiSpotTimer = (rt.kwesiSpotTimer ?? 0) + dt;
    if (rt.kwesiSpotTimer >= SPOT_BUILD_SEC) {
      rt.kwesiExposeTimer = (rt.kwesiExposeTimer ?? 0) + dt;
      if (rt.kwesiExposeTimer >= exposeLimit) {
        captureKwesi(state, rt);
        return { captured: true };
      }
      return { bark: `Spotted — ${Math.ceil(exposeLimit - rt.kwesiExposeTimer)}s to hide` };
    }
    return { bark: 'Constable watching — stay in shadow' };
  }

  rt.kwesiSpotTimer = Math.max(0, (rt.kwesiSpotTimer ?? 0) - dt * SPOT_DECAY_RATE);
  rt.kwesiExposeTimer = Math.max(0, (rt.kwesiExposeTimer ?? 0) - dt * SPOT_DECAY_RATE);
  return {};
}

export function handleKwesiHit(state, squadUnit, runtime) {
  if (!isKwesiMission(runtime) || squadUnit.id !== CLERK_ID || runtime.kwesiCaptured) return false;
  if (squadUnit.hp > 0) return false;
  squadUnit.hp = 1;
  captureKwesi(state, runtime);
  return true;
}
