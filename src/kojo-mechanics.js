/**
 * Kojo — 1st in Command / cell leader combat & command constants.
 * Full spec: docs/characters/kojo-cell-leader.md
 */

export const KOJO_ID = 'kojo';

export const KOJO_COMMAND = {
  tier: 1,
  title: '1st in Command',
  canIssueSquadOrders: true,
  defaultPlayer: true,
};

export const KOJO_STATS = {
  power: 65,
  agility: 95,
  durability: 70,
  technical: 85,
  stealth: 90,
};

export const KOJO_ABILITIES = {
  squad_order: { targets: ['araba', 'kofi', 'kwesi'], types: ['hold', 'suppress', 'flank', 'extract_kwesi'] },
  tactical_roll: { cooldownSec: 2.5, iFrames: 0.35 },
  low_sweep_kick: { damage: 'light', effect: 'stagger' },
  smoke_packet: { durationSec: 6, breaksTracking: true },
  flank_mark: { reveals: 'weak_flank_route' },
  run_and_gun_light: { weaponClass: ['pistol', 'carbine'], mobilityBonus: 0.15 },
};

export const KOJO_SQUAD_ORDERS = {
  hold_choke: { issuer: KOJO_ID, executor: 'araba', ability: 'choke_point_hold' },
  suppress: { issuer: KOJO_ID, executor: 'kofi', ability: 'suppress_fire' },
  riot_extract: { issuer: KOJO_ID, executor: 'araba', ability: 'riot_rally', condition: 'kojo_spotted' },
};

/** @deprecated Non-combat clerk role moved to Kwesi — use src/kwesi-mechanics.js */
export { KWESI_ID as CLERK_SUPPORT_ID } from './kwesi-mechanics.js';
