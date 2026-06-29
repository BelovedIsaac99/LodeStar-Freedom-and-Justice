/**
 * Accra Freedom Grid — sector status and map helpers
 */

import { isMissionUnlocked } from './campaign.js';

export function getSectorStatus(sector, save) {
  const missionIds = sector.missionIds ?? [];
  const completed = missionIds.filter((id) => save.completedMissions.includes(id));
  const unlocked = missionIds.some((id) => isMissionUnlocked(save, id));
  const allDone = missionIds.length > 0 && completed.length === missionIds.length;
  const partial = completed.length > 0 && !allDone;
  return {
    missionIds,
    completedCount: completed.length,
    total: missionIds.length,
    unlocked,
    allDone,
    partial,
    locked: !unlocked,
  };
}

export function getRouteStatus(route, save) {
  const gate = route.unlockedAfterMission;
  const open = gate == null || save.completedMissions.includes(gate);
  const missionsDone = (route.missionIds ?? []).filter((id) => save.completedMissions.includes(id)).length;
  return { open, missionsDone, missionTotal: (route.missionIds ?? []).length };
}

export function getStrongholdStatus(stronghold, save) {
  const gate = stronghold.reachableAfterMission;
  const reachable = gate != null && save.completedMissions.includes(gate);
  return { reachable, epilogueOnly: stronghold.epilogueOnly === true };
}

export function sectorById(grid, id) {
  return grid?.sectors?.find((s) => s.id === id) ?? null;
}

export function missionsForSector(grid, sectorId) {
  return sectorById(grid, sectorId)?.missionIds ?? [];
}
