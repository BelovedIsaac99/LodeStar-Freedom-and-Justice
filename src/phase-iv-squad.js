/**
 * Phase IV squad — command structure, stats, Kofi growth curve.
 * Data source: src/youth-squad.json
 */

export const COMMAND_TIER = {
  FIRST: 1,
  SECOND: 2,
  MEMBER: 3,
};

export const CELL_LEADER_ID = 'kojo';
export const ENFORCER_ID = 'araba';
export const ROOKIE_ID = 'kofi';
export const CLERK_ID = 'kwesi';
export const MENTOR_ID = 'yaw_mensah';

export const KOFI_GROWTH = {
  xpMultiplier: 1.75,
  missionsForLateTier: 8,
  lerpStat: (early, late, progress) => early + (late - early) * Math.min(1, progress),
};

/** @param {number} missionsCompleted @param {object} early @param {object} late */
export function getKofiStats(missionsCompleted, early, late) {
  const progress = Math.min(1, missionsCompleted / KOFI_GROWTH.missionsForLateTier);
  const out = {};
  for (const key of Object.keys(early)) {
    out[key] = Math.round(KOFI_GROWTH.lerpStat(early[key], late[key], progress));
  }
  out.recoilPenalty = 1 - progress * 0.65;
  out.dodgeQuality = 0.35 + progress * 0.6;
  return out;
}

export function canIssueSquadOrders(characterId) {
  return characterId === CELL_LEADER_ID;
}

export function shouldTriggerRiotRally(kojoState) {
  return kojoState?.spotted === true || kojoState?.trapped === true;
}
