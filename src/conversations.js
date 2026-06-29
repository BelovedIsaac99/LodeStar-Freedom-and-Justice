/**
 * Dialogue overlays from conversations.json — prologue, origin scenes, mission beats
 */

import { showMissionMessage } from './mission.js';
import { markBackstorySeen } from './campaign.js';

/** First mission appearance unlocks a one-time character backstory overlay */
export const BACKSTORY_MISSION_UNLOCKS = {
  1: 'adjetey',
  2: 'attipoe',
  3: 'lamptey',
  5: 'kofi_asare',
  8: 'nkrumah',
  11: 'kojo',
  12: 'araba',
  13: 'kofi_rookie',
  14: 'kwesi',
};

export const BACKSTORY_HUB_KEY = 'yaw';

export function getScenesForMission(conversations, mission, campaignSave) {
  if (!conversations?.phaseIvOrigin || mission.id !== 11) return [];
  if (campaignSave.phaseIvOriginSeen) return [];
  return [...(conversations.phaseIvOrigin.scenes ?? [])].sort((a, b) => a.order - b.order);
}

export function shouldPlayOriginOnMission(mission, campaignSave) {
  return mission.id === 11 && !campaignSave.phaseIvOriginSeen;
}

export function formatSceneLines(scene) {
  const header = [scene.when, scene.where].filter(Boolean).join('\n');
  const body = (scene.lines ?? [])
    .map((line) => `${line.speaker}: "${line.text}"`)
    .join('\n\n');
  return { title: scene.where ?? 'Scene', header, body };
}

export function queueOriginScenes(runtime, scenes) {
  for (const scene of scenes) {
    const { title, header, body } = formatSceneLines(scene);
    runtime.messageQueue.push({
      title,
      text: `${header}\n\n${body}`,
      isOrigin: true,
    });
  }
}

export function playYawHubBriefing(youthData, missionId, kofiGrowth) {
  const mentor = youthData?.mentor;
  const title = `${mentor?.shortName ?? 'Yaw'} — Ussher Yard`;
  const text = [
    mentor?.tagline,
    'Tools checked. Routes mapped. Hit AWAM — not Auntie Esi.',
    kofiGrowth > 0 ? `Kofi is learning fast (${kofiGrowth}/8 toward elite tier).` : 'Keep the boy alive long enough to learn.',
    `Dusk mission ${missionId}. All four return — or none.`,
  ].filter(Boolean).join('\n\n');
  return { title, text };
}

export function getMissionLines(conversations, missionId, phase) {
  const block = conversations?.missions?.[String(missionId)];
  if (!block) return null;
  return block[phase] ?? null;
}

export function getMissionTarget(conversations, missionId) {
  return conversations?.missions?.[String(missionId)]?.missionTarget ?? null;
}

export function getTriggerLines(conversations, missionId, triggerKey) {
  const block = conversations?.missions?.[String(missionId)];
  return block?.triggers?.[triggerKey] ?? null;
}

export function getIntelDialogue(conversations, missionId, intelTitle) {
  const intelMap = conversations?.missions?.[String(missionId)]?.triggers?.intel;
  if (!intelMap) return null;
  return intelMap[intelTitle] ?? null;
}

export function formatDialogueLines(lines, title) {
  if (!lines?.length) return null;
  const speakers = [...new Set(lines.map((l) => l.speaker))];
  const overlayTitle = title ?? (speakers.length === 1 ? speakers[0] : 'Briefing');
  const text = lines.map((line) => `${line.speaker}: "${line.text}"`).join('\n\n');
  return { title: overlayTitle, text };
}

function pushDialogue(runtime, formatted, toFront = false) {
  if (!formatted) return false;
  const entry = { title: formatted.title, text: formatted.text };
  if (toFront) runtime.messageQueue.unshift(entry);
  else runtime.messageQueue.push(entry);
  return true;
}

export function queueMissionDialogue(runtime, conversations, missionId, phase, title) {
  const lines = getMissionLines(conversations, missionId, phase);
  return pushDialogue(runtime, formatDialogueLines(lines, title));
}

export function queueMissionDialogueFront(runtime, conversations, missionId, phase, title) {
  const lines = getMissionLines(conversations, missionId, phase);
  return pushDialogue(runtime, formatDialogueLines(lines, title), true);
}

export function queueTriggerDialogue(runtime, conversations, missionId, triggerKey, title) {
  const lines = getTriggerLines(conversations, missionId, triggerKey);
  return pushDialogue(runtime, formatDialogueLines(lines, title));
}

export function queueIntelDialogue(runtime, conversations, missionId, intelTitle) {
  const lines = getIntelDialogue(conversations, missionId, intelTitle);
  return pushDialogue(runtime, formatDialogueLines(lines, intelTitle));
}

export function queueEpilogue(runtime, conversations) {
  const ep = conversations?.epilogue;
  if (!ep?.lines?.length) return false;
  return pushDialogue(runtime, formatDialogueLines(ep.lines, ep.title));
}

export function getAsareTriggerKey(eventKey) {
  if (eventKey === 'start') return 'asareStart';
  if (eventKey === 'ambush') return 'ambush';
  if (eventKey === 'witness') return 'witness';
  return null;
}

export function getCellTriggerKey(eventKey) {
  if (eventKey === 'start') return 'cellStart';
  return null;
}

export function resolveAsareDialogue(conversations, missionId, eventKey, fallbackMessage) {
  const triggerKey = getAsareTriggerKey(eventKey);
  const lines = triggerKey ? getTriggerLines(conversations, missionId, triggerKey) : null;
  if (lines?.length) return formatDialogueLines(lines, 'Kofi Asare');
  if (fallbackMessage) return { title: 'Kofi Asare', text: fallbackMessage };
  return null;
}

export function resolveCellDialogue(conversations, missionId, eventKey, fallbackMessage, fallbackSpeaker) {
  const triggerKey = getCellTriggerKey(eventKey);
  const lines = triggerKey ? getTriggerLines(conversations, missionId, triggerKey) : null;
  if (lines?.length) return formatDialogueLines(lines, 'Cell Signal');
  if (fallbackMessage) return { title: fallbackSpeaker ?? 'Cell Signal', text: fallbackMessage };
  return null;
}

export function resolveRadioDialogue(conversations, missionId, fallbackSpeaker, fallbackMessage) {
  const lines = getTriggerLines(conversations, missionId, 'radio');
  if (lines?.length) return formatDialogueLines(lines, fallbackSpeaker ?? 'Radio');
  if (fallbackMessage) return { title: fallbackSpeaker ?? 'Radio', text: fallbackMessage };
  return null;
}

/**
 * Fire a one-shot mission trigger (extraction, demolition, etc.)
 */
export function fireMissionTrigger(runtime, conversations, missionId, triggerKey, title) {
  if (!runtime.dialogueFlags) runtime.dialogueFlags = {};
  if (runtime.dialogueFlags[triggerKey]) return false;
  runtime.dialogueFlags[triggerKey] = true;
  return queueTriggerDialogue(runtime, conversations, missionId, triggerKey, title);
}

export function getCharacterBackstory(conversations, characterKey) {
  return conversations?.characterBackstories?.[characterKey] ?? null;
}

export function getBackstoryKeyForMission(missionId) {
  return BACKSTORY_MISSION_UNLOCKS[missionId] ?? null;
}

export function hasBackstorySeen(campaignSave, characterKey) {
  return (campaignSave?.backstoriesSeen ?? []).includes(characterKey);
}

export function queueCharacterBackstory(runtime, conversations, campaignSave, characterKey) {
  if (!characterKey || hasBackstorySeen(campaignSave, characterKey)) return false;
  const story = getCharacterBackstory(conversations, characterKey);
  if (!story?.lines?.length) return false;
  markBackstorySeen(campaignSave, characterKey);
  return pushDialogue(runtime, formatDialogueLines(story.lines, story.title ?? 'Backstory'));
}

export function getYawHubBackstorySnippet(conversations, campaignSave) {
  if (hasBackstorySeen(campaignSave, BACKSTORY_HUB_KEY)) return null;
  const story = getCharacterBackstory(conversations, BACKSTORY_HUB_KEY);
  if (!story?.lines?.length) return null;
  markBackstorySeen(campaignSave, BACKSTORY_HUB_KEY);
  const snippet = story.lines.slice(0, 2);
  return formatDialogueLines(snippet, story.title ?? 'Yaw Mensah');
}

export function getTensionBark(conversations, eventKey) {
  const lines = conversations?.tensionBarks?.[eventKey];
  if (!lines?.length) return null;
  return lines[Math.floor(Math.random() * lines.length)];
}
