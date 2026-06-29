/**
 * Mission loader, world builder, objective tracker
 */

import { dist } from './squad.js';
import { adjustAsareTrust } from './campaign.js';
import { resolveAsareDialogue, resolveCellDialogue, resolveRadioDialogue, getTriggerLines, formatDialogueLines } from './conversations.js';

export function createMissionRuntime(mission, campaignSave) {
  return {
    data: mission,
    objectives: mission.objectives.map((o) => ({ ...o, done: false })),
    intelCollected: 0,
    intelRequired: mission.intel?.length || 0,
    enemiesKilled: 0,
    enemiesRequired: mission.objectives.find((o) => o.type === 'eliminate_enemies')?.count
      ?? countEnemies(mission),
    demolitionDone: 0,
    witnessesDone: 0,
    witnessesRequired: mission.objectives.find((o) => o.type === 'witness')?.count ?? 0,
    holdTimer: 0,
    holdRequired: mission.holdZone?.duration ?? 0,
    holdActive: false,
    ambushTriggered: false,
    courierCaptured: false,
    handoffDone: false,
    asareWitnessed: false,
    tailStarted: false,
    tailFailed: false,
    tributeShown: false,
    waypointIndex: 0,
    status: 'active',
    messageQueue: [],
    riotRallyUsed: false,
    riotRallyTimer: 0,
    kojoOrderIndex: -1,
    kofiFirstShotDone: false,
    radioFired: false,
    dialogueFlags: {},
    kwesiSpotTimer: 0,
    kwesiExposeTimer: 0,
    kwesiCaptured: false,
    kwesiRescued: false,
    kwesiRescueTimer: 0,
  };
}

function countEnemies(mission) {
  return mission.enemies?.length ?? 0;
}

export function showMissionMessage(runtime, title, text, onClose) {
  runtime.messageQueue.push({ title, text, onClose });
}

export function popMessage(runtime) {
  return runtime.messageQueue.shift();
}

export function buildEscorts(mission) {
  return (mission.escorts ?? []).map((e, i) => ({
    ...e,
    x: e.x,
    y: e.y,
    dead: false,
    radius: e.cart ? 14 : 8,
    offsetX: (i % 3) * 15 - 15,
    offsetY: Math.floor(i / 3) * 18 + 25,
    hp: e.vip ? 40 : 25,
    maxHp: e.vip ? 40 : 25,
  }));
}

export function buildIntel(mission) {
  return (mission.intel ?? []).map((item) => ({
    ...item,
    radius: 12,
    collected: false,
    pulse: 0,
    locked: item.requiresCourier ?? false,
  }));
}

export function buildNodes(mission) {
  const nodes = [];
  (mission.nodes ?? []).forEach((n) => {
    nodes.push({ ...n, radius: 18, done: false, holdProgress: 0 });
  });
  (mission.witnessNodes ?? []).forEach((n) => {
    nodes.push({ ...n, radius: 16, done: false, type: 'witness' });
  });
  return nodes;
}

export function inZone(pos, zone) {
  if (!zone) return false;
  return dist(pos, zone) <= zone.radius;
}

export function updateHoldZone(runtime, playerPos, dt, spawnWave) {
  const zone = runtime.data.holdZone;
  if (!zone) return;
  const inside = inZone(playerPos, zone);
  runtime.holdActive = inside;
  if (inside) {
    runtime.holdTimer += dt;
    if (zone.waves && spawnWave) spawnWave(dt);
  }
}

export function checkAmbush(runtime, playerPos) {
  const ambush = runtime.data.ambushAt;
  if (!ambush || runtime.ambushTriggered) return false;
  if (dist(playerPos, ambush) <= ambush.radius) {
    runtime.ambushTriggered = true;
    return true;
  }
  return false;
}

export function updateTailAsare(runtime, playerPos, asareNpc) {
  if (!asareNpc) return;
  const d = dist(playerPos, asareNpc);
  if (!runtime.tailStarted && d < 200) runtime.tailStarted = true;
  if (runtime.tailStarted && d > 200) runtime.tailFailed = true;
}

export function interactNode(runtime, playerPos, nodes, radius) {
  for (const node of nodes) {
    if (node.done) continue;
    if (dist(playerPos, node) > (node.radius ?? 16) + radius) continue;
    if (node.type === 'demolition') {
      node.holdProgress = (node.holdProgress ?? 0) + 1;
      if (node.holdProgress >= 90) {
        node.done = true;
        runtime.demolitionDone++;
        return { type: 'demolition', node };
      }
      return { type: 'demolition_progress', node };
    }
    if (node.type === 'witness') {
      node.done = true;
      runtime.witnessesDone++;
      return { type: 'witness', node };
    }
  }
  return null;
}

export function evaluateObjectives(runtime, state) {
  const m = runtime.data;
  const playerPos = {
    x: state.player.body.position.x,
    y: state.player.body.position.y,
  };
  const escortsAlive = state.escorts.filter((e) => !e.dead).length;
  const vipsAlive = state.escorts.filter((e) => !e.dead && e.vip).length;

  for (const obj of runtime.objectives) {
    if (obj.done) continue;
    switch (obj.type) {
      case 'collect_intel':
        if (runtime.intelCollected >= (obj.count ?? runtime.intelRequired)) obj.done = true;
        break;
      case 'eliminate_enemies':
        if (runtime.enemiesKilled >= (obj.count ?? runtime.enemiesRequired)) obj.done = true;
        break;
      case 'reach_extraction': {
        let zone = m.extraction;
        if (zone?.requiresTrust && state.campaign.asareTrust < zone.requiresTrust) {
          zone = m.altExtraction ?? zone;
        }
        const tributeOk = m.id !== 10 || runtime.tributeShown;
        if (zone && inZone(playerPos, zone) && tributeOk) obj.done = true;
        break;
      }
      case 'escort_to_zone': {
        const min = obj.minAlive ?? 1;
        const zone = m.extraction;
        if (escortsAlive >= min && zone && inZone(playerPos, zone)) obj.done = true;
        break;
      }
      case 'escort_waypoints': {
        const wps = m.waypoints ?? [];
        const minEscorts = obj.minAlive ?? 1;
        if (runtime.waypointIndex >= wps.length && escortsAlive >= minEscorts
            && m.extraction && inZone(playerPos, m.extraction)) {
          obj.done = true;
        }
        break;
      }
      case 'demolition':
        if (runtime.demolitionDone >= (obj.count ?? 2)) obj.done = true;
        break;
      case 'hold_zone':
        if (runtime.holdTimer >= runtime.holdRequired) obj.done = true;
        break;
      case 'protect_vip':
        if (runtime.holdTimer >= runtime.holdRequired && vipsAlive >= (obj.minAlive ?? 1)) obj.done = true;
        break;
      case 'capture_courier':
        if (runtime.courierCaptured) obj.done = true;
        break;
      case 'reach_handoff':
        if (runtime.handoffDone) obj.done = true;
        break;
      case 'survive_ambush':
        if (runtime.ambushTriggered) obj.done = true;
        break;
      case 'tail_asare':
        if (runtime.asareWitnessed && !runtime.tailFailed) obj.done = true;
        break;
      case 'witness':
        if (runtime.witnessesDone >= (obj.count ?? 1)) obj.done = true;
        break;
      default:
        break;
    }
  }

  return runtime.objectives.every((o) => o.done);
}

export function advanceWaypoints(runtime, playerPos, mission, campaign, conversations) {
  const wps = mission.waypoints;
  if (!wps || runtime.waypointIndex >= wps.length) return;
  const wp = wps[runtime.waypointIndex];
  if (dist(playerPos, { x: wp[0], y: wp[1] }) < 50) {
    runtime.waypointIndex++;
    const evt = mission.asareEvent;
    if (evt?.triggerAtWaypoint === runtime.waypointIndex && campaign) {
      adjustAsareTrust(campaign, evt.trustDelta ?? 0);
      const waypointLines = getTriggerLines(conversations, mission.id, 'onWaypoint');
      if (waypointLines?.length) {
        const formatted = formatDialogueLines(waypointLines, 'Signal');
        if (formatted) showMissionMessage(runtime, formatted.title, formatted.text);
      } else if (evt.message) {
        showMissionMessage(runtime, 'Signal', evt.message);
      }
    }
  }
}

export function applyAsareEvent(runtime, campaign, eventKey, conversations) {
  const evt = runtime.data.asareEvent;
  if (!evt) return;
  let fire = false;
  if (eventKey === 'start' && evt.triggerOnStart) fire = true;
  if (eventKey === 'ambush' && evt.triggerOnAmbush) fire = true;
  if (eventKey === 'witness' && evt.triggerOnWitness) fire = true;
  if (fire) {
    const dlg = resolveAsareDialogue(conversations, runtime.data.id, eventKey, evt.message);
    if (dlg) showMissionMessage(runtime, dlg.title, dlg.text);
    if (evt.trustDelta) adjustAsareTrust(campaign, evt.trustDelta);
  }
}

export function applyCellEvent(runtime, eventKey, conversations) {
  const evt = runtime.data.cellEvent;
  if (!evt) return;
  let fire = false;
  if (eventKey === 'start' && evt.triggerOnStart) fire = true;
  if (fire) {
    const dlg = resolveCellDialogue(
      conversations,
      runtime.data.id,
      eventKey,
      evt.message,
      evt.speaker
    );
    if (dlg) showMissionMessage(runtime, dlg.title, dlg.text);
  }
}

export function resolveRadioEvent(runtime, conversations) {
  const radio = runtime.data.radioEvent;
  if (!radio) return null;
  return resolveRadioDialogue(conversations, runtime.data.id, radio.speaker, radio.message);
}

export function getObjectiveSummary(runtime) {
  const pending = runtime.objectives.filter((o) => !o.done);
  if (!pending.length) return 'All objectives complete — extract!';
  return pending[0].label;
}

let stateRef = null;
export function setStateRef(s) { stateRef = s; }
