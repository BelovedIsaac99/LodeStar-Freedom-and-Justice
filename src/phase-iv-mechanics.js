/**
 * Phase IV gameplay — Riot Rally, Kojo orders, Kwesi wiretap, Kofi growth moments
 */

import { dist } from './squad.js';
import { CELL_LEADER_ID, ENFORCER_ID, ROOKIE_ID, CLERK_ID } from './phase-iv-squad.js';

export const KOJO_ORDERS = [
  { id: 'hold_choke', label: 'HOLD', squadState: 'DEFEND', barkKey: 'kojo_order_hold', targetName: 'Araba' },
  { id: 'suppress', label: 'SUPPRESS', squadState: 'ATTACK', barkKey: 'kojo_order_suppress', targetName: 'Kofi' },
  { id: 'flank', label: 'FLANK', squadState: 'FOLLOW', barkKey: 'kojo_order_flank', targetName: 'Squad' },
];

export const WIRETAP = {
  durationSec: 8,
  cooldownSec: 22,
  revealRadius: 9999,
};

export const RIOT_RALLY = {
  smokeDurationSec: 8,
  losMultiplier: 0.35,
  arabaSlotHint: ENFORCER_ID,
};

export function countNearbyEnemies(pos, enemies, range = 120) {
  let n = 0;
  for (const e of enemies) {
    if (e.dead) continue;
    const ex = e.x ?? e.body?.position.x;
    const ey = e.y ?? e.body?.position.y;
    if (dist(pos, { x: ex, y: ey }) <= range) n++;
  }
  return n;
}

export function shouldTriggerRiotRally(player, enemies, runtime, phaseIvActive) {
  if (!phaseIvActive || runtime.riotRallyUsed || player?.id !== CELL_LEADER_ID) return false;
  const maxHp = player.maxHp ?? 100;
  const lowHp = maxHp > 0 && player.hp / maxHp <= 0.4;
  const pos = { x: player.body.position.x, y: player.body.position.y };
  const surrounded = countNearbyEnemies(pos, enemies, 110) >= 3;
  return lowHp || surrounded;
}

export function applySmokeToEnemies(enemies, durationSec) {
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.losRadiusBase == null) e.losRadiusBase = e.losRadius ?? 175;
    e.smokeTimer = durationSec;
    e.losRadius = Math.max(50, e.losRadiusBase * RIOT_RALLY.losMultiplier);
  }
}

export function tickEnemySmoke(enemies, dt) {
  for (const e of enemies) {
    if (e.smokeTimer == null || e.smokeTimer <= 0) continue;
    e.smokeTimer -= dt;
    if (e.smokeTimer <= 0 && e.losRadiusBase != null) {
      e.losRadius = e.losRadiusBase;
      e.smokeTimer = 0;
    }
  }
}

export function getArabaSlotIndex(roster) {
  return roster?.findIndex((c) => c.id === ENFORCER_ID) ?? 1;
}

export function cycleKojoOrder(runtime) {
  const idx = ((runtime.kojoOrderIndex ?? -1) + 1) % KOJO_ORDERS.length;
  runtime.kojoOrderIndex = idx;
  return KOJO_ORDERS[idx];
}

export function canUseWiretap(player, phaseIvActive, cooldown) {
  return phaseIvActive && player?.id === CLERK_ID && (cooldown ?? 0) <= 0;
}

export function activateWiretap(state, durationSec = WIRETAP.durationSec) {
  state.wiretapActive = durationSec;
  state.wiretapCooldown = WIRETAP.cooldownSec;
  for (const e of state.enemies) {
    if (!e.dead) e.revealed = true;
  }
}

export function tickWiretap(state, dt) {
  if (state.wiretapActive > 0) {
    state.wiretapActive = Math.max(0, state.wiretapActive - dt);
    if (state.wiretapActive <= 0) {
      for (const e of state.enemies) { e.revealed = false; }
    }
  }
  if (state.wiretapCooldown > 0) {
    state.wiretapCooldown = Math.max(0, state.wiretapCooldown - dt);
  }
}

export function showBark(state, text, durationSec = 3.5) {
  state.barkText = text;
  state.barkTimer = durationSec;
}

export function tickBark(state, dt) {
  if (state.barkTimer > 0) {
    state.barkTimer = Math.max(0, state.barkTimer - dt);
    if (state.barkTimer <= 0) state.barkText = '';
  }
}

export function checkKofiFirstShot(player, runtime, conversations) {
  if (runtime.kofiFirstShotDone || player?.id !== ROOKIE_ID) return null;
  return conversations?.barks?.kofi_first_shot ?? 'Kofi: "I… I hit something!"';
}

export function markKofiFirstShot(runtime) {
  runtime.kofiFirstShotDone = true;
}
