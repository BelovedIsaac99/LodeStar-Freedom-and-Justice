/** Campaign progress, Asare trust, mission unlocks — persisted in localStorage */

const SAVE_KEY = 'lodestar_freedom_justice_save';
export const MAX_MISSION_ID = 15;
export const PHASE_IV_START = 11;

export function defaultSave(asareConfig) {
  return {
    version: 2,
    unlockedMission: 1,
    completedMissions: [],
    asareTrust: asareConfig?.trustStart ?? 40,
    independenceMeter: 0,
    currentMission: 1,
    commendations: [],
    phaseIvUnlocked: false,
    phaseIvOriginSeen: false,
    phaseIvMissionsCompleted: 0,
    kofiGrowthProgress: 0,
    yawBriefingsSeen: [],
    kofiUpgrades: [],
    documentsReviewed: [],
    toolsRepaired: false,
    prologueSeen: false,
    backstoriesSeen: [],
  };
}

export function loadSave(asareConfig) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave(asareConfig);
    const data = JSON.parse(raw);
    const save = { ...defaultSave(asareConfig), ...data };
    if (save.completedMissions.includes(10)) save.phaseIvUnlocked = true;
    if (save.phaseIvUnlocked && save.unlockedMission < PHASE_IV_START) {
      save.unlockedMission = PHASE_IV_START;
    }
    return save;
  } catch {
    return defaultSave(asareConfig);
  }
}

export function writeSave(save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function completeMission(save, missionId, meterGain, commendation) {
  if (!save.completedMissions.includes(missionId)) {
    save.completedMissions.push(missionId);
    if (commendation?.id && !save.commendations.find((c) => c.id === commendation.id)) {
      save.commendations.push({
        id: commendation.id,
        name: commendation.name,
        desc: commendation.desc,
        missionId,
      });
    }
  }
  save.independenceMeter = Math.min(100, save.independenceMeter + (meterGain || 10));

  if (missionId === 10) {
    save.phaseIvUnlocked = true;
    if (save.unlockedMission < PHASE_IV_START) save.unlockedMission = PHASE_IV_START;
  } else if (missionId >= save.unlockedMission && missionId < MAX_MISSION_ID) {
    save.unlockedMission = missionId + 1;
  }

  if (missionId >= PHASE_IV_START) {
    save.phaseIvMissionsCompleted = save.completedMissions.filter((id) => id >= PHASE_IV_START).length;
    save.kofiGrowthProgress = save.phaseIvMissionsCompleted;
  }

  writeSave(save);
}

export function adjustAsareTrust(save, delta) {
  save.asareTrust = Math.max(0, Math.min(100, save.asareTrust + delta));
  writeSave(save);
  return save.asareTrust;
}

export function markPhaseIvOriginSeen(save) {
  save.phaseIvOriginSeen = true;
  writeSave(save);
}

export function markPrologueSeen(save) {
  save.prologueSeen = true;
  writeSave(save);
}

export function markBackstorySeen(save, characterKey) {
  if (!characterKey) return;
  if (!save.backstoriesSeen) save.backstoriesSeen = [];
  if (!save.backstoriesSeen.includes(characterKey)) {
    save.backstoriesSeen.push(characterKey);
    writeSave(save);
  }
}

export function markYawBriefingSeen(save, missionId) {
  if (!save.yawBriefingsSeen.includes(missionId)) {
    save.yawBriefingsSeen.push(missionId);
    writeSave(save);
  }
}

export function resetCampaign(asareConfig) {
  const save = defaultSave(asareConfig);
  writeSave(save);
  return save;
}

export function isMissionUnlocked(save, missionId) {
  if (missionId >= PHASE_IV_START && !save.phaseIvUnlocked) return false;
  return missionId <= save.unlockedMission || save.completedMissions.includes(missionId);
}

export function isPhaseIvMission(missionId) {
  return missionId >= PHASE_IV_START;
}
