/**
 * Build playable Phase IV squad roster from youth-squad.json data.
 */

import { getKofiStats } from './phase-iv-squad.js';

const FOLLOW_OFFSETS = [
  { angle: Math.PI + 0.5, dist: 48 },
  { angle: Math.PI + 1.0, dist: 55 },
  { angle: Math.PI + 1.5, dist: 50 },
];

export function buildPhaseIvRoster(youthData, kofiGrowthProgress = 0, kofiUpgradeMods = null) {
  const order = ['kojo', 'araba', 'kofi', 'kwesi'];
  const byId = Object.fromEntries((youthData.roster ?? []).map((c) => [c.id, c]));

  return order.map((id, i) => {
    const cfg = byId[id];
    if (!cfg) return null;

    let stats = cfg.stats;
    if (id === 'kofi' && cfg.statsEarly && cfg.statsLate) {
      stats = getKofiStats(kofiGrowthProgress, cfg.statsEarly, cfg.statsLate);
      if (kofiUpgradeMods) {
        stats.recoilPenalty = Math.max(0.05, (stats.recoilPenalty ?? 0.5) + (kofiUpgradeMods.recoilPenaltyDelta ?? 0));
        stats.dodgeQuality = Math.min(1, (stats.dodgeQuality ?? 0.5) + (kofiUpgradeMods.dodgeQualityDelta ?? 0));
      }
    }

    const speed = cfg.speed ?? 4.5;
    let shootRate = cfg.canFireWeapons === false ? 0 : (cfg.shootRate ?? 0.4);
    if (id === 'kofi' && kofiUpgradeMods?.shootRateMult) {
      shootRate *= kofiUpgradeMods.shootRateMult;
    }

    return {
      id: cfg.id,
      name: cfg.shortName ?? cfg.name,
      role: cfg.role,
      commandTier: cfg.commandTier,
      combatStatus: cfg.combatStatus,
      canFireWeapons: cfg.canFireWeapons !== false,
      radius: cfg.radius ?? 13,
      speed: speed + (stats?.agility ? (stats.agility - 50) * 0.008 : 0),
      shootRate: shootRate * (stats?.power ? 1 - (stats.power - 50) * 0.002 : 1),
      hp: cfg.hp ?? 80,
      maxHp: cfg.maxHp ?? cfg.hp ?? 80,
      followOffset: i === 0 ? null : FOLLOW_OFFSETS[i - 1],
      isPlayer: i === 0,
      colorIdx: [2, 8, 3, 6][i],
    };
  }).filter(Boolean);
}

export function getCharacterSlotIndex(roster, characterId) {
  return roster.findIndex((c) => c.id === characterId);
}

export function getMentorBriefing(youthData, missionId, kofiGrowth) {
  const mentor = youthData.mentor;
  const lines = [
    mentor?.tagline ?? 'Come back alive — all four.',
    `Mission ${missionId} briefing from ${mentor?.shortName ?? 'Yaw'}.`,
  ];
  if (kofiGrowth > 0) {
    lines.push(`Kofi's Fast Learner progress: ${kofiGrowth}/8 missions toward elite tier.`);
  }
  return lines.join('\n\n');
}
