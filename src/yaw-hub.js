/**
 * Yaw's Base Hub — War Board (Kojo), Workshop (Yaw), Registry (Kwesi)
 */

import { writeSave, isMissionUnlocked } from './campaign.js';

export function getWarBoardEntries(hubData, missions, save) {
  return (hubData.warBoardDistricts ?? []).map((district) => {
    const mission = missions.find((m) => m.id === district.missionId);
    const unlocked = isMissionUnlocked(save, district.missionId);
    const done = save.completedMissions.includes(district.missionId);
    const recommended = !done && unlocked
      && district.missionId === save.unlockedMission;
    return {
      ...district,
      missionTitle: mission?.title ?? `Mission ${district.missionId}`,
      unlocked,
      done,
      recommended,
    };
  });
}

export function getNextDeployMission(hubData, save) {
  const entries = getWarBoardEntries(hubData, [], save);
  const next = entries.find((e) => e.recommended && e.unlocked && !e.done);
  return next?.missionId ?? null;
}

export function getWorkshopOffers(hubData, save) {
  const owned = new Set(save.kofiUpgrades ?? []);
  const meter = save.independenceMeter ?? 0;
  return (hubData.workshopUpgrades ?? []).map((up) => {
    const purchased = owned.has(up.id) || (up.once && up.effect?.toolsRepaired && save.toolsRepaired);
    const reqsMet = (up.requires ?? []).every((r) => owned.has(r));
    const canAfford = meter >= up.cost;
    return {
      ...up,
      purchased,
      reqsMet,
      canAfford,
      canBuy: !purchased && reqsMet && canAfford,
    };
  });
}

export function purchaseWorkshopUpgrade(save, upgradeId, hubData) {
  const offers = getWorkshopOffers(hubData, save);
  const offer = offers.find((o) => o.id === upgradeId);
  if (!offer?.canBuy) return { ok: false, reason: 'Cannot purchase' };

  save.independenceMeter = Math.max(0, (save.independenceMeter ?? 0) - offer.cost);
  if (!save.kofiUpgrades) save.kofiUpgrades = [];
  if (!save.kofiUpgrades.includes(upgradeId)) save.kofiUpgrades.push(upgradeId);
  if (offer.effect?.toolsRepaired) save.toolsRepaired = true;
  writeSave(save);
  return { ok: true, yawLine: offer.yawLine };
}

export function getRegistryDocuments(hubData, save) {
  const reviewed = new Set(save.documentsReviewed ?? []);
  const completed = new Set(save.completedMissions ?? []);
  return (hubData.registryDocuments ?? []).map((doc) => ({
    ...doc,
    unlocked: completed.has(doc.unlockMission),
    reviewed: reviewed.has(doc.id),
  }));
}

export function reviewRegistryDocument(save, docId, hubData) {
  const docs = getRegistryDocuments(hubData, save);
  const doc = docs.find((d) => d.id === docId);
  if (!doc?.unlocked) return { ok: false, reason: 'Locked' };
  if (doc.reviewed) return { ok: true, already: true, doc };

  if (!save.documentsReviewed) save.documentsReviewed = [];
  save.documentsReviewed.push(docId);
  const bonus = hubData.reviewBonus ?? 2;
  save.independenceMeter = Math.min(100, (save.independenceMeter ?? 0) + bonus);
  writeSave(save);
  return { ok: true, doc, bonus };
}

/** Stat modifiers applied when spawning Kofi */
export function getKofiUpgradeModifiers(save, hubData) {
  const owned = new Set(save.kofiUpgrades ?? []);
  const mods = {
    recoilPenaltyDelta: 0,
    shootRateMult: 1,
    dodgeQualityDelta: 0,
  };
  for (const up of hubData?.workshopUpgrades ?? []) {
    if (!owned.has(up.id)) continue;
    if (up.effect?.kofiRecoilPenalty) mods.recoilPenaltyDelta += up.effect.kofiRecoilPenalty;
    if (up.effect?.kofiShootRateMult) mods.shootRateMult *= up.effect.kofiShootRateMult;
    if (up.effect?.kofiDodgeQuality) mods.dodgeQualityDelta += up.effect.kofiDodgeQuality;
  }
  return mods;
}
