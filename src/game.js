/**
 * LODESTAR_FREEDOM AND JUSTICE
 * Campaign-driven tactical shooter — litecanvas + Matter.js
 */

import {
  SQUAD_STATE,
  SQUAD_ROSTER,
  dist,
  findNearestEnemy,
  cycleSquadState,
  updateFollower,
  updateEscort,
  updateAsareNpc,
} from './squad.js';

import {
  loadSave,
  writeSave,
  completeMission,
  adjustAsareTrust,
  resetCampaign,
  isMissionUnlocked,
  isPhaseIvMission,
  markPhaseIvOriginSeen,
  markPrologueSeen,
  PHASE_IV_START,
} from './campaign.js';

import {
  createMissionRuntime,
  buildEscorts,
  buildIntel,
  buildNodes,
  inZone,
  updateHoldZone,
  checkAmbush,
  updateTailAsare,
  interactNode,
  evaluateObjectives,
  advanceWaypoints,
  applyAsareEvent,
  applyCellEvent,
  getObjectiveSummary,
  showMissionMessage,
  popMessage,
  setStateRef,
  resolveRadioEvent,
} from './mission.js';

import { buildPhaseIvRoster, getCharacterSlotIndex } from './youth-squad-loader.js';
import {
  getScenesForMission,
  shouldPlayOriginOnMission,
  queueOriginScenes,
  queueMissionDialogue,
  queueMissionDialogueFront,
  queueEpilogue,
  fireMissionTrigger,
  formatDialogueLines,
  getIntelDialogue,
} from './conversations.js';
import { canCharacterFire } from './kwesi-mechanics.js';
import { loadAssetManifest, loadLeonardoExportMap, loadMissionTextures, countLoadedTextures, getMissionSceneUrl, getStrategyMapUrl, getCoverArtUrl, clearTextureCache } from './asset-loader.js';
import {
  getSectorStatus,
  getRouteStatus,
  getStrongholdStatus,
} from './freedom-grid.js';
import {
  getWarBoardEntries,
  getWorkshopOffers,
  purchaseWorkshopUpgrade,
  getRegistryDocuments,
  reviewRegistryDocument,
  getKofiUpgradeModifiers,
  getNextDeployMission,
} from './yaw-hub.js';
import {
  shouldTriggerRiotRally,
  applySmokeToEnemies,
  tickEnemySmoke,
  getArabaSlotIndex,
  cycleKojoOrder,
  canUseWiretap,
  activateWiretap,
  tickWiretap,
  showBark,
  tickBark,
  checkKofiFirstShot,
  markKofiFirstShot,
  RIOT_RALLY,
} from './phase-iv-mechanics.js';
import {
  initKwesiCapture,
  updateKwesiCapture,
  tryRescueKwesi,
  canRescueKwesi,
  handleKwesiHit,
} from './kwesi-capture.js';

import {
  sfxShoot, sfxHit, sfxIntel, sfxOrder, sfxComplete, sfxFail, sfxInteract, sfxTribute,
} from './audio.js';

import { createGameView3D } from './view3d.js';
import { createJoystick } from './joystick.js';
import { getMoveVector as computeMoveVector, getMissionPhase } from './input.js';

const GAME_W = 800;
const GAME_H = 600;

const state = {
  phase: 'menu',
  missions: [],
  campaign: null,
  asareConfig: null,
  missionRuntime: null,
  currentMissionId: 1,
  squadState: SQUAD_STATE.FOLLOW,
  paused: false,
  gameOver: false,
  missionComplete: false,
  Matter: null,
  engine: null,
  world: null,
  staticBodies: [],
  player: null,
  followers: [],
  enemies: [],
  bullets: [],
  intelItems: [],
  nodes: [],
  escorts: [],
  checkpoints: [],
  obstacles: [],
  asareNpc: null,
  waveTimer: 0,
  interactHint: '',
  keys: {},
  joystick: { x: 0, y: 0, angle: 0, magnitude: 0, degrees: 0 },
  joystickCtrl: null,
  overlay: null,
  overlayTitle: null,
  overlaySubtitle: null,
  overlayCommendation: null,
  overlayText: null,
  touchUi: null,
  commanderName: 'Dr. Kwame Nkrumah',
  view3d: null,
  bulletPool: [],
  campaignPhases: [],
  historicalFigures: null,
  youthSquad: null,
  conversations: null,
  phaseIvActive: false,
  phaseIvRoster: [],
  squadUnits: [],
  playerSlot: 0,
  assetManifest: null,
  leonardoExportMap: null,
  kwesiStatusHint: '',
  freedomGrid: null,
  yawHubData: null,
  yawHubSelectedMission: null,
  wiretapActive: 0,
  wiretapCooldown: 0,
  barkText: '',
  barkTimer: 0,
};

setStateRef(state);

// ─── Matter helpers ───────────────────────────────────────────────────────
function createCircleBody(Matter, x, y, radius, opts = {}) {
  return Matter.Bodies.circle(x, y, radius, { frictionAir: 0.15, restitution: 0.2, ...opts });
}

function createRectBody(Matter, x, y, w, h) {
  return Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, friction: 0.8, label: 'obstacle' });
}

function clearWorld() {
  const { Matter, world, bullets, staticBodies } = state;
  if (!world) return;
  for (const b of [...bullets]) removeBullet(b);
  for (const body of staticBodies) Matter.Composite.remove(world, body);
  state.staticBodies = [];
  for (const e of state.enemies) {
    if (e.body) Matter.Composite.remove(world, e.body);
  }
  if (state.squadUnits?.length) {
    for (const u of state.squadUnits) {
      if (u.body) Matter.Composite.remove(world, u.body);
    }
    state.squadUnits = [];
    state.phaseIvActive = false;
  } else {
    if (state.player?.body) Matter.Composite.remove(world, state.player.body);
    for (const f of state.followers) {
      if (f.body) Matter.Composite.remove(world, f.body);
    }
  }
  state.enemies = [];
  state.player = null;
  state.followers = [];
}

function acquireBulletBody(Matter, label) {
  const pooled = state.bulletPool.pop();
  if (pooled) {
    pooled.label = label;
    Matter.Body.set(pooled, { isSleeping: false });
    return pooled;
  }
  return Matter.Bodies.circle(0, 0, 3, { frictionAir: 0, label });
}

function releaseBulletBody(Matter, world, body) {
  Matter.Body.setVelocity(body, { x: 0, y: 0 });
  Matter.Body.setPosition(body, { x: -9999, y: -9999 });
  Matter.Body.set(body, { isSleeping: true });
  Matter.Composite.remove(world, body);
  if (state.bulletPool.length < 48) state.bulletPool.push(body);
}

function spawnBullet(x, y, angle, speed, fromPlayer, shooterRadius) {
  const { Matter, world, bullets } = state;
  const bx = x + Math.cos(angle) * (shooterRadius + 6);
  const by = y + Math.sin(angle) * (shooterRadius + 6);
  const label = fromPlayer ? 'playerBullet' : 'enemyBullet';
  const body = acquireBulletBody(Matter, label);
  Matter.Body.setPosition(body, { x: bx, y: by });
  Matter.Body.setVelocity(body, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed });
  const data = { body, fromPlayer, life: 2.5 };
  bullets.push(data);
  Matter.Composite.add(world, body);
}

function removeBullet(bulletData) {
  const { Matter, world, bullets } = state;
  releaseBulletBody(Matter, world, bulletData.body);
  const idx = bullets.indexOf(bulletData);
  if (idx >= 0) bullets.splice(idx, 1);
}

function clampBody(body, radius) {
  const { Matter } = state;
  const x = Math.max(radius, Math.min(GAME_W - radius, body.position.x));
  const y = Math.max(radius, Math.min(GAME_H - radius, body.position.y));
  if (x !== body.position.x || y !== body.position.y) {
    Matter.Body.setPosition(body, { x, y });
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
  }
}

function refreshSquadPointers() {
  if (!state.phaseIvActive || !state.squadUnits.length) return;
  state.player = state.squadUnits[state.playerSlot];
  state.followers = [0, 1, 2, 3]
    .filter((i) => i !== state.playerSlot)
    .map((i) => state.squadUnits[i]);
}

function switchToSlot(slot) {
  if (!state.phaseIvActive || slot === state.playerSlot || slot < 0 || slot > 3) return;
  state.playerSlot = slot;
  refreshSquadPointers();
  sfxOrder();
}

function spawnVeteranSquad(mission, ps) {
  const { Matter } = state;
  const leaderCfg = SQUAD_ROSTER[0];
  const playerBody = createCircleBody(Matter, ps.x, ps.y, leaderCfg.radius, {
    label: 'player',
    frictionAir: 0.2,
  });
  state.player = {
    body: playerBody,
    ...leaderCfg,
    hp: 100,
    maxHp: 100,
    shootCooldown: 0,
    angle: 0,
  };
  Matter.Composite.add(state.world, playerBody);

  state.followers = SQUAD_ROSTER.slice(1).map((cfg, i) => {
    const body = createCircleBody(Matter, ps.x - 40, ps.y - 20 + i * 40, cfg.radius, {
      label: 'follower',
      frictionAir: 0.25,
    });
    Matter.Composite.add(state.world, body);
    return {
      body, ...cfg,
      hp: mission.woundAttipoe && i === 0 ? 45 : 100,
      maxHp: 100,
      shootCooldown: 0,
      defendPos: null,
      angle: 0,
    };
  });
}

function spawnPhaseIvSquad(mission, ps) {
  const { Matter } = state;
  const mods = getKofiUpgradeModifiers(state.campaign, state.yawHubData);
  const roster = buildPhaseIvRoster(
    state.youthSquad,
    state.campaign.kofiGrowthProgress ?? 0,
    mods
  );
  state.phaseIvRoster = roster;
  state.phaseIvActive = true;

  state.squadUnits = roster.map((cfg, i) => {
    const body = createCircleBody(Matter, ps.x - i * 28, ps.y + (i % 2) * 22, cfg.radius, {
      label: i === 0 ? 'player' : 'follower',
      frictionAir: 0.22,
    });
    Matter.Composite.add(state.world, body);
    return {
      body,
      ...cfg,
      shootCooldown: 0,
      defendPos: null,
      angle: 0,
    };
  });

  const defaultId = mission.defaultCharacter ?? 'kojo';
  state.playerSlot = Math.max(0, getCharacterSlotIndex(roster, defaultId));
  refreshSquadPointers();
}

function assetUrl(rel) {
  if (!rel) return null;
  const v = state.leonardoExportMap?.version ?? 1;
  const path = `./${rel.split('/').map((p) => encodeURIComponent(p)).join('/')}`;
  return `${path}?v=${v}`;
}

function getBark(key) {
  return state.conversations?.barks?.[key] ?? null;
}

function playPrologueThenMenu() {
  const p = state.conversations?.prologue;
  if (state.campaign.prologueSeen || !p?.lines?.length) {
    renderMissionMenu();
    return;
  }
  let index = 0;
  const showNext = () => {
    if (index >= p.lines.length) {
      markPrologueSeen(state.campaign);
      renderMissionMenu();
      return;
    }
    const line = p.lines[index];
    const isFirst = index === 0;
    index++;
    showOverlay(
      isFirst ? p.title : line.speaker,
      line.text,
      showNext,
      isFirst ? p.subtitle : undefined,
      isFirst ? p.historicalNote : undefined
    );
  };
  showNext();
}

function triggerRiotRally() {
  const rt = state.missionRuntime;
  if (!rt || rt.riotRallyUsed) return;
  rt.riotRallyUsed = true;
  rt.riotRallyTimer = RIOT_RALLY.smokeDurationSec;
  applySmokeToEnemies(state.enemies, RIOT_RALLY.smokeDurationSec);
  const arabaSlot = getArabaSlotIndex(state.phaseIvRoster);
  if (arabaSlot >= 0) switchToSlot(arabaSlot);
  state.squadState = SQUAD_STATE.ATTACK;
  updateCommandButtonLabel();
  const bark = getBark('araba_riot_rally');
  if (bark) showBark(state, bark, 4);
  sfxOrder();
}

function issueKojoOrder() {
  if (!state.phaseIvActive || state.player?.id !== 'kojo' || !state.missionRuntime) return;
  const order = cycleKojoOrder(state.missionRuntime);
  state.squadState = SQUAD_STATE[order.squadState] ?? SQUAD_STATE.FOLLOW;
  updateCommandButtonLabel();
  const bark = getBark(order.barkKey);
  if (bark) showBark(state, bark);
  sfxOrder();
}

function tryWiretap() {
  if (!canUseWiretap(state.player, state.phaseIvActive, state.wiretapCooldown)) return;
  activateWiretap(state);
  const bark = getBark('kwesi_wiretap');
  if (bark) showBark(state, bark);
  sfxIntel();
}

function requestLoadMission(missionId) {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission || !isMissionUnlocked(state.campaign, missionId)) return;

  if (mission.phaseIv && state.campaign.phaseIvUnlocked) {
    openYawHub({ pendingMissionId: missionId });
    return;
  }

  loadMission(missionId);
}

function closeYawHub() {
  document.getElementById('yaw-hub')?.classList.remove('active');
  state.phase = 'menu';
}

function openYawHub(opts = {}) {
  if (!state.campaign.phaseIvUnlocked || !state.yawHubData) {
    renderMissionMenu();
    return;
  }
  hideMissionMenu();
  document.getElementById('yaw-hub')?.classList.add('active');
  state.phase = 'hub';

  const pending = opts.pendingMissionId;
  const next = getNextDeployMission(state.yawHubData, state.campaign);
  state.yawHubSelectedMission = pending ?? next ?? PHASE_IV_START;

  if (state.youthSquad?.mentor?.tagline) {
    const tag = document.getElementById('hub-tagline');
    if (tag) tag.textContent = state.youthSquad.mentor.tagline;
  }
  renderYawHub();
}

function renderYawHub() {
  if (!state.yawHubData) return;
  const meterEl = document.getElementById('hub-meter-display');
  if (meterEl) meterEl.textContent = state.campaign.independenceMeter ?? 0;

  renderWarBoard();
  renderWorkshop();
  renderRegistry();
  updateDeployButton();
}

function renderWarBoard() {
  const el = document.getElementById('war-board-content');
  if (!el) return;
  el.innerHTML = '';
  const entries = getWarBoardEntries(state.yawHubData, state.missions, state.campaign);

  for (const entry of entries) {
    const sector = state.freedomGrid?.sectors?.find((s) => s.id === entry.sectorId);
    const card = document.createElement('div');
    card.className = 'hub-item'
      + (entry.done ? ' done' : '')
      + (!entry.unlocked ? ' locked' : '')
      + (entry.missionId === state.yawHubSelectedMission ? ' selected' : '');
    const sceneUrl = getMissionSceneUrl(state.leonardoExportMap, entry.missionId);
    if (sceneUrl) {
      const thumb = document.createElement('img');
      thumb.className = 'hub-mission-thumb';
      thumb.src = sceneUrl;
      thumb.alt = '';
      thumb.loading = 'lazy';
      card.appendChild(thumb);
    }
    const body = document.createElement('div');
    body.innerHTML = `
      <strong>${entry.label}</strong>
      ${sector ? `<span class="meta">Sector ${sector.number}: ${sector.subtitle}</span>` : ''}
      <span class="meta">M${entry.missionId} — ${entry.missionTitle}</span>
      <span class="meta">${entry.summary}</span>
      ${entry.done ? '<span class="meta">✓ District secured</span>' : ''}
      ${entry.recommended ? '<span class="meta">★ Kojo recommends next</span>' : ''}`;
    card.appendChild(body);
    if (entry.unlocked) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = entry.missionId === state.yawHubSelectedMission ? 'Selected' : 'Pin on board';
      btn.disabled = entry.missionId === state.yawHubSelectedMission;
      btn.addEventListener('click', () => {
        state.yawHubSelectedMission = entry.missionId;
        renderYawHub();
      });
      card.appendChild(btn);
    }
    el.appendChild(card);
  }
}

function renderWorkshop() {
  const el = document.getElementById('workshop-content');
  if (!el) return;
  el.innerHTML = '';
  const offers = getWorkshopOffers(state.yawHubData, state.campaign);

  for (const offer of offers) {
    const card = document.createElement('div');
    card.className = 'hub-item' + (offer.purchased ? ' done' : '');
    card.innerHTML = `
      <strong>${offer.name}</strong>
      <span class="meta">${offer.description}</span>
      <span class="meta">Cost: ${offer.cost}% momentum${offer.purchased ? ' — Installed' : ''}</span>
      ${!offer.reqsMet && !offer.purchased ? '<span class="meta">Requires prior upgrade</span>' : ''}`;
    if (!offer.purchased) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = offer.canBuy ? 'Yaw installs' : (offer.canAfford ? 'Locked' : 'Need momentum');
      btn.disabled = !offer.canBuy;
      btn.addEventListener('click', () => {
        const result = purchaseWorkshopUpgrade(state.campaign, offer.id, state.yawHubData);
        if (result.ok && result.yawLine) {
          showOverlay('Yaw — Workshop', result.yawLine, () => renderYawHub());
        } else {
          renderYawHub();
        }
      });
      card.appendChild(btn);
    }
    el.appendChild(card);
  }
}

function renderRegistry() {
  const el = document.getElementById('registry-content');
  if (!el) return;
  el.innerHTML = '';
  const docs = getRegistryDocuments(state.yawHubData, state.campaign);

  for (const doc of docs) {
    const card = document.createElement('div');
    card.className = 'hub-item'
      + (doc.reviewed ? ' done' : '')
      + (!doc.unlocked ? ' locked' : '');
    card.innerHTML = `
      <strong>${doc.title}</strong>
      <span class="meta">${doc.category} — unlocks after M${doc.unlockMission}</span>
      ${doc.reviewed ? '<span class="meta">✓ Filed for Watson Commission</span>' : ''}
      ${!doc.unlocked ? '<span class="meta">🔒 Not yet intercepted</span>' : ''}`;
    if (doc.unlocked && !doc.reviewed) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Kwesi reads aloud';
      btn.addEventListener('click', () => {
        const result = reviewRegistryDocument(state.campaign, doc.id, state.yawHubData);
        if (result.ok && result.doc) {
          const bonus = result.already ? '' : `\n\n+${result.bonus ?? 0}% Independence momentum filed.`;
          showOverlay(doc.title, result.doc.text + bonus, () => renderYawHub());
        }
      });
      card.appendChild(btn);
    } else if (doc.unlocked && doc.reviewed) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'secondary';
      btn.textContent = 'Re-read';
      btn.addEventListener('click', () => {
        showOverlay(doc.title, doc.text, () => renderYawHub());
      });
      card.appendChild(btn);
    }
    el.appendChild(card);
  }
}

function updateDeployButton() {
  const btn = document.getElementById('hub-deploy-btn');
  if (!btn) return;
  const id = state.yawHubSelectedMission;
  const mission = state.missions.find((m) => m.id === id);
  const unlocked = id && isMissionUnlocked(state.campaign, id);
  btn.disabled = !unlocked;
  btn.textContent = mission
    ? `Deploy — M${id}: ${mission.title}`
    : 'Deploy — Kojo\'s Orders';
}

function deployFromHub() {
  const id = state.yawHubSelectedMission;
  if (!id || !isMissionUnlocked(state.campaign, id)) return;
  closeYawHub();
  loadMission(id);
}

function loadMission(missionId) {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) return;

  clearWorld();
  const { Matter } = state;
  state.currentMissionId = missionId;
  state.missionRuntime = createMissionRuntime(mission, state.campaign);
  if (mission.kwesiMission) initKwesiCapture(state.missionRuntime);
  state.campaign.currentMission = missionId;
  writeSave(state.campaign);
  state.squadState = SQUAD_STATE.FOLLOW;
  state.gameOver = false;
  state.missionComplete = false;
  state.paused = false;
  state.phase = 'playing';
  state.waveTimer = 0;
  state.wiretapActive = 0;
  state.wiretapCooldown = 0;
  state.barkText = '';
  state.barkTimer = 0;
  state.kwesiStatusHint = '';

  const ps = mission.playerStart;
  if (mission.phaseIv || isPhaseIvMission(missionId)) {
    spawnPhaseIvSquad(mission, ps);
  } else {
    spawnVeteranSquad(mission, ps);
  }

  if (shouldPlayOriginOnMission(mission, state.campaign)) {
    const scenes = getScenesForMission(state.conversations, mission, state.campaign);
    queueOriginScenes(state.missionRuntime, scenes);
  }

  state.enemies = (mission.enemies ?? []).map(([x, y, type]) => {
    const isCourier = type === 'courier';
    const body = createCircleBody(Matter, x, y, isCourier ? 12 : 16, {
      isStatic: !isCourier,
      label: isCourier ? 'courier' : 'enemy',
    });
    Matter.Composite.add(state.world, body);
    return {
      body, x, y,
      radius: isCourier ? 12 : 16,
      hp: isCourier ? 30 : 60,
      maxHp: isCourier ? 30 : 60,
      shootCooldown: 0,
      shootRate: isCourier ? 0 : 1.1,
      losRadius: isCourier ? 0 : 175,
      angle: 0,
      dead: false,
      isCourier,
    };
  });

  state.checkpoints = (mission.checkpoints ?? []).map(([x, y]) => ({ x, y, w: 40, h: 40 }));
  state.obstacles = mission.obstacles ?? [];
  for (const [x, y, w, h] of state.obstacles) {
    const b = createRectBody(Matter, x, y, w, h);
    Matter.Composite.add(state.world, b);
    state.staticBodies.push(b);
  }

  const walls = [
    Matter.Bodies.rectangle(GAME_W / 2, -10, GAME_W, 20, { isStatic: true }),
    Matter.Bodies.rectangle(GAME_W / 2, GAME_H + 10, GAME_W, 20, { isStatic: true }),
    Matter.Bodies.rectangle(-10, GAME_H / 2, 20, GAME_H, { isStatic: true }),
    Matter.Bodies.rectangle(GAME_W + 10, GAME_H / 2, 20, GAME_H, { isStatic: true }),
  ];
  walls.forEach((w) => {
    Matter.Composite.add(state.world, w);
    state.staticBodies.push(w);
  });

  state.intelItems = buildIntel(mission);
  state.nodes = buildNodes(mission);
  state.escorts = buildEscorts(mission);

  if (mission.asareNpc) {
    state.asareNpc = {
      ...mission.asareNpc,
      pathIndex: 0,
      radius: 12,
    };
  } else {
    state.asareNpc = null;
  }

  if (mission.asareEvent?.x) {
    state.asareMarker = { x: mission.asareEvent.x, y: mission.asareEvent.y };
  } else {
    state.asareMarker = null;
  }

  hideMissionMenu();
  setTouchUiVisible(true);
  updateCommandButtonLabel();
  showMissionIntro(mission);

  loadAssetManifest().then((manifest) => {
    state.assetManifest = manifest;
    return loadMissionTextures(manifest, missionId, state.leonardoExportMap);
  }).then((textures) => {
    state.view3d?.setMissionTextures(textures);
    const n = countLoadedTextures(textures);
    if (n > 0) state.missionRuntime.loadedAssetCount = n;
  });
}

function showMissionIntro(mission) {
  const cmd = state.phaseIvActive
    ? `Yaw Mensah — ${state.youthSquad?.campaignLabel ?? 'Phase IV'}`
    : state.commanderName;
  const body = `${mission.briefing}\n\nObjectives:\n${mission.objectives.map((o) => `• ${o.label}`).join('\n')}`;
  const controls = state.phaseIvActive
    ? '\n\n1–4 switch character | Kwesi cannot fire'
    : '';
  const sceneUrl = getMissionSceneUrl(state.leonardoExportMap, mission.id);
  showOverlay(
    `Mission ${mission.id}: ${mission.title}`,
    body + controls,
    () => {
      if (mission.phaseIv) {
        applyCellEvent(state.missionRuntime, 'start', state.conversations);
        if (mission.id === PHASE_IV_START && shouldPlayOriginOnMission(mission, state.campaign)) {
          markPhaseIvOriginSeen(state.campaign);
        }
      } else {
        applyAsareEvent(state.missionRuntime, state.campaign, 'start', state.conversations);
      }
      queueMissionDialogueFront(
        state.missionRuntime,
        state.conversations,
        mission.id,
        'start',
        `Mission ${mission.id}`
      );
      if (mission.woundAttipoe) {
        fireMissionTrigger(state.missionRuntime, state.conversations, mission.id, 'onWoundAttipoe', 'Wounded');
      }
      const msg = popMessage(state.missionRuntime);
      if (msg) showOverlay(msg.title ?? 'Briefing', msg.text);
    },
    mission.subtitle ? `${cmd} — ${mission.subtitle}` : cmd,
    mission.historicalNote,
    sceneUrl
  );
}

function getCommendation(mission) {
  if (mission.commendation) return mission.commendation;
  return {
    id: `mission-${mission.id}`,
    name: `${mission.title} Medal`,
    desc: mission.victoryText,
  };
}

function spawnWaveEnemy() {
  const { Matter, missionRuntime } = state;
  const zone = missionRuntime.data.holdZone;
  if (!zone) return;
  const angle = Math.random() * Math.PI * 2;
  const x = zone.x + Math.cos(angle) * (zone.radius + 60);
  const y = zone.y + Math.sin(angle) * (zone.radius + 60);
  const body = createCircleBody(Matter, x, y, 14, { isStatic: true, label: 'enemy' });
  Matter.Composite.add(state.world, body);
  state.enemies.push({
    body, x, y, radius: 14, hp: 40, maxHp: 40,
    shootCooldown: 0, shootRate: 1.4, losRadius: 160, angle: 0, dead: false,
  });
}

// ─── Input ────────────────────────────────────────────────────────────────
function setupInput() {
  document.addEventListener('keydown', (e) => {
    state.keys[e.code] = true;
    if (e.code === 'Space' && state.phase === 'playing' && !state.paused) {
      e.preventDefault();
      state.squadState = cycleSquadState(state.squadState);
      sfxOrder();
      updateCommandButtonLabel();
    }
    if (e.code === 'KeyE' && state.phase === 'playing' && !state.paused) {
      tryInteract();
    }
    if (state.phaseIvActive && state.phase === 'playing' && !state.paused) {
      if (e.code === 'Digit1') switchToSlot(0);
      if (e.code === 'Digit2') switchToSlot(1);
      if (e.code === 'Digit3') switchToSlot(2);
      if (e.code === 'Digit4') switchToSlot(3);
    }
    if (e.code === 'Tab' && state.phase === 'playing' && !state.paused) {
      e.preventDefault();
      if (state.phaseIvActive && state.player?.id === 'kojo') issueKojoOrder();
    }
    if (e.code === 'KeyQ' && state.phase === 'playing' && !state.paused) {
      tryWiretap();
    }
    if (e.code === 'Escape' && state.phase === 'playing') {
      state.paused = true;
      showOverlay('Paused', 'Press Continue or ESC to resume.', () => {});
    }
  });
  document.addEventListener('keyup', (e) => {
    state.keys[e.code] = false;
    if (e.code === 'Escape' && state.paused && state.phase === 'playing') {
      state.overlay.classList.remove('active');
      state.paused = false;
      updateJoystickEnabled();
    }
  });

  document.getElementById('command-btn').addEventListener('click', (e) => {
    e.preventDefault();
    if (state.phase !== 'playing' || state.paused) return;
    state.squadState = cycleSquadState(state.squadState);
    sfxOrder();
    updateCommandButtonLabel();
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Reset all campaign progress?')) {
      state.campaign = resetCampaign(state.asareConfig);
      renderMissionMenu();
    }
  });

  const zone = document.getElementById('joystick-zone');
  state.joystickCtrl = createJoystick(zone, (joy) => {
    state.joystick.x = joy.x;
    state.joystick.y = joy.y;
    state.joystick.angle = joy.angle;
    state.joystick.magnitude = joy.magnitude;
    state.joystick.degrees = joy.degrees;
  });
  updateJoystickEnabled();
}

function updateJoystickEnabled() {
  const active = state.phase === 'playing'
    && !state.paused
    && !state.touchUi?.classList.contains('hidden');
  state.joystickCtrl?.setEnabled(active);
}

function getPlayerMove() {
  return computeMoveVector(state.keys, state.joystick);
}

function updateCommandButtonLabel() {
  const btn = document.getElementById('command-btn');
  const labels = { FOLLOW: 'FOLLOW', DEFEND: 'DEFEND', ATTACK: 'ATTACK' };
  btn.innerHTML = `SQUAD<br>${labels[state.squadState] ?? 'CMD'}`;
}

function tryInteract() {
  const rt = state.missionRuntime;
  if (!rt) return;
  if (tryRescueKwesi(state, rt)) {
    sfxInteract();
    refreshSquadPointers();
    const bark = getBark('kwesi_document');
    if (bark) showBark(state, bark, 4);
    return;
  }
  const pos = { x: state.player.body.position.x, y: state.player.body.position.y };
  const result = interactNode(rt, pos, state.nodes, state.player.radius);
  if (!result) return;

  if (result.type === 'witness') {
    sfxIntel();
    state.paused = true;
    showOverlay('Witness Account', result.node.text, () => {
      if (rt.data.id === 7) {
        rt.asareWitnessed = true;
        applyAsareEvent(rt, state.campaign, 'witness', state.conversations);
      }
      if (rt.data.id === 10) {
        if (rt.witnessesDone >= 2) applyAsareEvent(rt, state.campaign, 'witness', state.conversations);
      }
    });
  }
  if (result.type === 'demolition') {
    sfxInteract();
    showOverlay('Demolition', `${result.node.label} — charges planted.`, () => {});
  }
}

function setTouchUiVisible(visible) {
  if (state.touchUi) state.touchUi.classList.toggle('hidden', !visible);
  updateJoystickEnabled();
}

function showOverlay(title, text, onClose, subtitle, historicalNote, imageUrl) {
  const imgEl = document.getElementById('overlay-image');
  const box = document.getElementById('overlay-box');
  if (imgEl && box) {
    if (imageUrl) {
      imgEl.src = imageUrl;
      imgEl.classList.add('visible');
      box.classList.add('has-image');
    } else {
      imgEl.removeAttribute('src');
      imgEl.classList.remove('visible');
      box.classList.remove('has-image');
    }
  }
  state.overlayTitle.textContent = title;
  state.overlayText.textContent = text;
  if (state.overlaySubtitle) {
    const sub = [subtitle, historicalNote].filter(Boolean).join('\n');
    state.overlaySubtitle.textContent = sub;
    state.overlaySubtitle.style.display = sub ? 'block' : 'none';
  }
  if (state.overlayCommendation) {
    state.overlayCommendation.classList.remove('visible');
    state.overlayCommendation.textContent = '';
  }
  state.overlayOnClose = onClose;
  state.overlay.classList.add('active');
  state.paused = true;
  updateJoystickEnabled();
}

function showCommendationOverlay(commendation) {
  if (!state.overlayCommendation || !commendation) return;
  state.overlayCommendation.innerHTML =
    `<strong>Commendation Earned</strong><br>${commendation.name}<br><span style="color:#8a9a8a">${commendation.desc}</span>`;
  state.overlayCommendation.classList.add('visible');
}

function closeOverlay() {
  state.overlay.classList.remove('active');
  state.paused = false;
  updateJoystickEnabled();
  if (state.overlayOnClose) state.overlayOnClose();
  state.overlayOnClose = null;
  const msg = popMessage(state.missionRuntime);
  if (msg) setTimeout(() => showOverlay(msg.title ?? 'Briefing', msg.text, msg.onClose ?? (() => {})), 300);
}

// ─── Mission menu (HTML) ──────────────────────────────────────────────────
function renderSectorCard(sector, grid, container) {
  const status = getSectorStatus(sector, state.campaign);
  const faction = grid.factionLegend?.[sector.faction];
  const card = document.createElement('div');
  card.className = 'grid-sector'
    + (status.allDone ? ' done' : '')
    + (status.locked ? ' locked' : '')
    + (status.partial ? ' partial' : '');
  const progress = status.total
    ? `${status.completedCount}/${status.total} missions`
    : 'Epilogue';
  card.innerHTML = `
    <span class="grid-faction" style="background:${faction?.color ?? '#333'}"></span>
    <span class="sector-num">Sector ${sector.number}</span>
    <strong>${sector.label}</strong>
    <span class="grid-district">${sector.subtitle}</span>
    <span class="grid-summary">${sector.summary}</span>
    <span class="grid-missions">M${sector.missionIds.join(', M')} · ${progress}</span>
    ${sector.hub ? '<span class="grid-hub">★ Yaw\'s Base Hub</span>' : ''}`;
  container.appendChild(card);
}

function renderFreedomGrid() {
  const el = document.getElementById('freedom-grid');
  if (!el || !state.freedomGrid) return;
  el.innerHTML = '';
  const grid = state.freedomGrid;
  const geo = grid.geography ?? {};

  const title = document.createElement('h2');
  title.textContent = grid.title;
  el.appendChild(title);
  const sub = document.createElement('p');
  sub.className = 'grid-subtitle';
  sub.textContent = grid.subtitle ?? '';
  el.appendChild(sub);
  if (geo.coast) {
    const coast = document.createElement('p');
    coast.className = 'grid-coast';
    coast.textContent = `▸ ${geo.coast} — ${geo.directionNote ?? 'west → east'}`;
    el.appendChild(coast);
  }

  const sm = grid.strategyMap;
  if (sm?.image || state.leonardoExportMap?.strategyMap) {
    const caption = document.createElement('p');
    caption.className = 'grid-strategy-caption';
    caption.textContent = sm?.alt ?? 'Coastal Accra — west local hubs to east colonial citadels';
    el.appendChild(caption);

    const mapWrap = document.createElement('div');
    mapWrap.className = 'grid-strategy-map';
    const img = document.createElement('img');
    img.src = getStrategyMapUrl(state.leonardoExportMap)
      ?? assetUrl(sm.image);
    img.alt = sm?.alt ?? 'Accra strategy map';
    img.loading = 'lazy';
    mapWrap.appendChild(img);

    for (const pin of sm.pins ?? []) {
      let pinClass = 'resistance';
      let locked = true;
      let done = false;
      if (pin.sectorId) {
        const sector = (grid.sectors ?? []).find((s) => s.id === pin.sectorId);
        if (sector) {
          const st = getSectorStatus(sector, state.campaign);
          pinClass = sector.faction ?? 'resistance';
          locked = st.locked;
          done = st.allDone;
        }
      } else if (pin.strongholdId && grid.stronghold) {
        const ss = getStrongholdStatus(grid.stronghold, state.campaign);
        pinClass = 'stronghold';
        locked = !ss.reachable;
        done = state.campaign.completedMissions.includes(15);
      }
      const dot = document.createElement('span');
      dot.className = `map-pin ${pinClass}${locked ? ' locked' : ''}${done ? ' done' : ''}`;
      dot.style.left = `${pin.x}%`;
      dot.style.top = `${pin.y}%`;
      mapWrap.appendChild(dot);
      if (pin.label) {
        const lbl = document.createElement('span');
        lbl.className = 'map-pin-label';
        lbl.style.left = `${pin.x}%`;
        lbl.style.top = `${pin.y}%`;
        lbl.textContent = pin.label;
        mapWrap.appendChild(lbl);
      }
    }
    el.appendChild(mapWrap);
  }

  const map = document.createElement('div');
  map.className = 'grid-map';

  const westCol = document.createElement('div');
  westCol.className = 'grid-column west';
  const westLabel = document.createElement('div');
  westLabel.className = 'grid-column-label';
  westLabel.textContent = geo.westLabel ?? 'WEST: LOCAL HUBS';
  westCol.appendChild(westLabel);
  const westSectors = (grid.sectors ?? []).filter((s) => s.side === 'west').sort((a, b) => a.order - b.order);
  westSectors.forEach((s) => renderSectorCard(s, grid, westCol));

  const corridor = document.createElement('div');
  corridor.className = 'grid-corridor';
  for (const route of grid.routes ?? []) {
    const rs = getRouteStatus(route, state.campaign);
    const row = document.createElement('div');
    row.className = 'grid-route' + (rs.open ? ' open' : ' locked');
    row.innerHTML = `
      <span class="route-arrow">${route.direction === 'west_to_east' ? '►' : '◄'}</span>
      <strong>${route.label}</strong>
      <span class="grid-district">${route.summary}</span>
      ${!rs.open ? `<span class="grid-missions">Locked until M${route.unlockedAfterMission}</span>` : ''}`;
    corridor.appendChild(row);
  }

  const eastCol = document.createElement('div');
  eastCol.className = 'grid-column east';
  const eastLabel = document.createElement('div');
  eastLabel.className = 'grid-column-label';
  eastLabel.textContent = geo.eastLabel ?? 'EAST: COLONIAL CITADELS';
  eastCol.appendChild(eastLabel);
  const eastSectors = (grid.sectors ?? []).filter((s) => s.side === 'east').sort((a, b) => a.order - b.order);
  eastSectors.forEach((s) => renderSectorCard(s, grid, eastCol));

  if (grid.stronghold) {
    const sh = grid.stronghold;
    const ss = getStrongholdStatus(sh, state.campaign);
    const hold = document.createElement('div');
    hold.className = 'grid-stronghold'
      + (ss.reachable ? ' reachable' : ' locked');
    const fc = grid.factionLegend?.[sh.faction];
    hold.innerHTML = `
      <span class="grid-faction" style="background:${fc?.color ?? '#333'}"></span>
      <span class="sector-num">Final Stronghold</span>
      <strong>${sh.label}</strong>
      <span class="grid-district">${sh.subtitle}</span>
      <span class="grid-summary">${sh.summary}</span>
      <span class="grid-missions">${ss.reachable ? 'Epilogue — petition blocked' : `Locked until M${sh.reachableAfterMission}`}</span>`;
    eastCol.appendChild(hold);
  }

  map.appendChild(westCol);
  map.appendChild(corridor);
  map.appendChild(eastCol);
  el.appendChild(map);

  if (grid.levelFlow?.length) {
    const flowTitle = document.createElement('p');
    flowTitle.className = 'grid-flow-title';
    flowTitle.textContent = 'Level flow';
    el.appendChild(flowTitle);
    const flowList = document.createElement('div');
    flowList.className = 'grid-flow-list';
    for (const step of grid.levelFlow) {
      const done = (step.missions ?? []).every((id) => state.campaign.completedMissions.includes(id));
      const row = document.createElement('div');
      row.className = 'grid-flow-step' + (done ? ' done' : '');
      row.textContent = `${step.step}. ${step.label} (M${(step.missions ?? []).join(', M')})`;
      flowList.appendChild(row);
    }
    el.appendChild(flowList);
  }
}

function renderMissionMenu() {
  const list = document.getElementById('mission-list');
  list.innerHTML = '';

  const coverUrl = getCoverArtUrl(state.leonardoExportMap);
  const coverEl = document.getElementById('menu-cover-art');
  if (coverEl) {
    if (coverUrl) {
      coverEl.src = coverUrl;
      coverEl.classList.add('visible');
    } else {
      coverEl.removeAttribute('src');
      coverEl.classList.remove('visible');
    }
  }

  for (const phase of state.campaignPhases) {
    if (!phase.missionIds?.length) continue;
    const header = document.createElement('div');
    header.className = 'phase-header';
    header.innerHTML = `<strong>${phase.label}</strong><br><span class="phase-sub">${phase.subtitle ?? ''}</span>`;
    list.appendChild(header);

    for (const mid of phase.missionIds) {
      const m = state.missions.find((x) => x.id === mid);
      if (!m) continue;
      const unlocked = isMissionUnlocked(state.campaign, m.id);
      const done = state.campaign.completedMissions.includes(m.id);
      const sceneUrl = getMissionSceneUrl(state.leonardoExportMap, m.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mission-btn' + (unlocked ? '' : ' locked') + (done ? ' done' : '');
      const thumbHtml = sceneUrl ? `<img class="m-thumb" src="${sceneUrl}" alt="" loading="lazy" />` : '';
      btn.innerHTML = `${thumbHtml}<span class="m-num">${m.id}</span><span class="m-title">${m.title}</span>${done ? ' ✓' : ''}`;
      btn.disabled = !unlocked;
      btn.addEventListener('click', () => requestLoadMission(m.id));
      list.appendChild(btn);
    }
  }

  document.getElementById('trust-display').textContent = state.campaign.asareTrust;
  document.getElementById('meter-display').textContent = state.campaign.independenceMeter;
  const medalCount = state.campaign.commendations?.length ?? 0;
  const medalEl = document.getElementById('medal-display');
  if (medalEl) medalEl.textContent = medalCount;
  const kofiEl = document.getElementById('kofi-display');
  if (kofiEl) {
    kofiEl.textContent = state.campaign.phaseIvUnlocked
      ? `${state.campaign.kofiGrowthProgress ?? 0}/8`
      : '—';
  }
  const hubBtn = document.getElementById('btn-yaw-hub');
  if (hubBtn) {
    hubBtn.disabled = !state.campaign.phaseIvUnlocked;
  }
  document.getElementById('mission-menu').classList.add('active');
  renderFreedomGrid();
  state.phase = 'menu';
  setTouchUiVisible(false);
}

function hideMissionMenu() {
  document.getElementById('mission-menu').classList.remove('active');
}

// ─── Collisions ───────────────────────────────────────────────────────────
function handleCollision(a, b) {
  const bullet = [a, b].find((x) => x.label === 'playerBullet' || x.label === 'enemyBullet');
  if (!bullet) return;
  const other = a === bullet ? b : a;
  const bulletData = state.bullets.find((bl) => bl.body === bullet);
  if (!bulletData) return;
  const { Matter } = state;
  const pushForce = 0.009;

  if (bullet.label === 'playerBullet') {
    if (other.label === 'enemy') {
      const enemy = state.enemies.find((e) => e.body === other);
      if (enemy && !enemy.dead) {
        enemy.hp -= 25;
        if (enemy.hp <= 0) {
          enemy.dead = true;
          state.missionRuntime.enemiesKilled++;
          sfxHit();
        }
      }
      removeBullet(bulletData);
    } else if (other.label === 'courier') {
      const courier = state.enemies.find((e) => e.body === other);
      if (courier && !courier.dead) {
        courier.hp -= 10;
        if (courier.hp <= 0) {
          courier.dead = true;
          state.gameOver = true;
          showOverlay('Mission Failed', 'Courier killed — seal destroyed.', () => {
            state.gameOver = false;
            renderMissionMenu();
          });
        } else if (courier.hp <= 15 && !courier.captured) {
          courier.captured = true;
          Matter.Body.setStatic(courier.body, true);
          state.missionRuntime.courierCaptured = true;
          state.intelItems.forEach((i) => { i.locked = false; });
        }
      }
      removeBullet(bulletData);
    }
  } else if (bullet.label === 'enemyBullet') {
    const squadUnit = [state.player, ...state.followers].find((u) => u.body === other);
    if (squadUnit && squadUnit.hp > 0) {
      squadUnit.hp -= 12;
      sfxHit();
      const angle = Math.atan2(other.position.y - bullet.position.y, other.position.x - bullet.position.x);
      Matter.Body.applyForce(other, other.position, {
        x: Math.cos(angle) * pushForce,
        y: Math.sin(angle) * pushForce,
      });
      if (state.phaseIvActive && state.missionRuntime?.data?.id === 15 && squadUnit.hp <= 0) {
        state.gameOver = true;
        sfxFail();
        showOverlay('Mission Failed', `${squadUnit.name} fell — Yaw needed all four alive.`, () => {});
      } else if (handleKwesiHit(state, squadUnit, state.missionRuntime)) {
        refreshSquadPointers();
        state.paused = true;
        showOverlay(
          'Kwesi Captured',
          'The clerk is down — constables are closing in. Switch to Kojo, Araba, or Kofi and press E at Kwesi\'s position to extract him.',
          () => {}
        );
      }
    }
    for (const esc of state.escorts) {
      if (esc.dead) continue;
      const d = dist(esc, { x: other.position.x, y: other.position.y });
      if (d < esc.radius + 8) {
        esc.hp -= 20;
        if (esc.hp <= 0) esc.dead = true;
      }
    }
    removeBullet(bulletData);
  }
}

// ─── Update loop ──────────────────────────────────────────────────────────
function updatePlayer(dt) {
  const { Matter } = state;
  const p = state.player;
  const { mx, my, angle } = getPlayerMove();
  if (mx !== 0 || my !== 0) {
    Matter.Body.setVelocity(p.body, { x: mx * p.speed * 25, y: my * p.speed * 25 });
    p.angle = angle;
  } else {
    Matter.Body.setVelocity(p.body, { x: 0, y: 0 });
  }
  clampBody(p.body, p.radius);
  p.shootCooldown = Math.max(0, p.shootCooldown - dt);

  const pos = { x: p.body.position.x, y: p.body.position.y };
  const nearest = findNearestEnemy(pos, state.enemies, 210);
  const fire = (state.keys['KeyF']
    || (state.squadState === SQUAD_STATE.DEFEND && nearest)
    || (state.squadState === SQUAD_STATE.ATTACK && nearest))
    && canCharacterFire(p.id)
    && p.canFireWeapons !== false;

  if (fire && p.shootCooldown <= 0) {
    const angle = nearest
      ? Math.atan2(nearest.y - pos.y, nearest.x - pos.x)
      : p.angle;
    spawnBullet(pos.x, pos.y, angle, 280, true, p.radius);
    p.shootCooldown = p.shootRate;
    p.angle = angle;
    sfxShoot();
    if (state.phaseIvActive && p.id === 'kofi' && !state.missionRuntime.kofiFirstShotDone) {
      const bark = checkKofiFirstShot(p, state.missionRuntime, state.conversations);
      if (bark) showBark(state, bark, 4);
      markKofiFirstShot(state.missionRuntime);
    }
  }

  if (state.keys['KeyE']) {
    const r = interactNode(state.missionRuntime, pos, state.nodes, p.radius);
    if (r?.type === 'demolition_progress') {
      state.interactHint = `Arming ${r.node.label}... ${Math.floor((r.node.holdProgress / 90) * 100)}%`;
    }
    if (r?.type === 'demolition') {
      sfxInteract();
      state.interactHint = '';
      showOverlay('Demolition', `${r.node.label} — charges planted.`, () => {});
      if (state.missionRuntime.data.id === 3 && state.missionRuntime.demolitionDone === 1) {
        fireMissionTrigger(state.missionRuntime, state.conversations, 3, 'onFirstDemolition', 'Demolition');
      }
      if (!state.phaseIvActive) {
        const bark = getBark('lamptey_demolition');
        if (bark) showBark(state, bark, 3);
      }
    }
  } else {
    state.interactHint = '';
  }
}

function updateEnemies(dt) {
  tickEnemySmoke(state.enemies, dt);
  for (const e of state.enemies) {
    if (e.dead || e.isCourier) continue;
    e.shootCooldown = Math.max(0, e.shootCooldown - dt);
    e.x = e.body.position.x;
    e.y = e.body.position.y;
    const targets = [state.player, ...state.followers].filter((t) => t.hp > 0);
    let closest = null;
    let closestDist = e.losRadius;
    for (const t of targets) {
      const tp = { x: t.body.position.x, y: t.body.position.y };
      const d = dist(e, tp);
      if (d < closestDist) { closestDist = d; closest = tp; }
    }
    if (closest && e.shootCooldown <= 0) {
      if (!state.missionRuntime.dialogueFlags?.firstContact && !state.phaseIvActive) {
        if (!state.missionRuntime.dialogueFlags) state.missionRuntime.dialogueFlags = {};
        state.missionRuntime.dialogueFlags.firstContact = true;
        const bark = getBark('adjetey_contact');
        if (bark) showBark(state, bark, 3);
      }
      const angle = Math.atan2(closest.y - e.y, closest.x - e.x);
      spawnBullet(e.x, e.y, angle, 200, false, e.radius);
      e.shootCooldown = e.shootRate;
      e.angle = angle;
    }
  }
}

function updateMissionLogic(dt) {
  const rt = state.missionRuntime;
  const m = rt.data;
  const playerPos = { x: state.player.body.position.x, y: state.player.body.position.y };
  const vipsAlive = state.escorts.filter((e) => !e.dead && e.vip).length;

  for (const item of state.intelItems) {
    if (item.collected || item.locked) continue;
    item.pulse += dt * 4;
    if (dist(playerPos, item) < state.player.radius + item.radius) {
      item.collected = true;
      rt.intelCollected++;
      sfxIntel();
      state.paused = true;
      const intelLines = getIntelDialogue(state.conversations, m.id, item.title);
      if (intelLines?.length) {
        const formatted = formatDialogueLines(intelLines, item.title);
        showOverlay(formatted.title, formatted.text, () => {});
      } else {
        showOverlay(item.title ?? 'Intel', item.text, () => {});
      }
      if (!state.phaseIvActive) {
        const bark = getBark('lamptey_intel');
        if (bark) showBark(state, bark, 3);
      }
    }
  }

  state.escorts.forEach((esc) => updateEscort(esc, playerPos, dt));

  if (m.asareNpc && state.asareNpc) updateAsareNpc(state.asareNpc, dt);
  if (m.id === 7) {
    updateTailAsare(rt, playerPos, state.asareNpc);
    if (rt.tailFailed && !state.gameOver) {
      state.gameOver = true;
      sfxFail();
      showOverlay('Blown Cover', 'You lost Asare in the crowd. Mission failed.', () => {});
    }
  }

  const protectObj = rt.objectives.find((o) => o.type === 'protect_vip' && !o.done);
  if (protectObj && vipsAlive < (protectObj.minAlive ?? 1)) {
    state.gameOver = true;
    sfxFail();
    showOverlay('Mission Failed', 'A speaker was lost. The square falls silent.', () => {});
    return;
  }

  if (checkAmbush(rt, playerPos)) {
    applyAsareEvent(rt, state.campaign, 'ambush', state.conversations);
    queueMissionDialogue(rt, state.conversations, m.id, 'mid', 'Ambush');
    state.paused = true;
    const ambushMsg = popMessage(rt);
    if (ambushMsg) showOverlay(ambushMsg.title, ambushMsg.text, () => {});
    for (let i = 0; i < 3; i++) spawnWaveEnemy();
  }

  if (m.extraction) {
    let zone = m.extraction;
    if (zone?.requiresTrust && state.campaign.asareTrust < zone.requiresTrust) {
      zone = m.altExtraction ?? zone;
    }
    if (zone && inZone(playerPos, zone)) {
      fireMissionTrigger(rt, state.conversations, m.id, 'onExtraction', 'Safe House');
    }
  }

  if (state.asareMarker && m.asareEvent?.x && !m.handoff) {
    if (dist(playerPos, state.asareMarker) < 45) {
      fireMissionTrigger(rt, state.conversations, m.id, 'asareStart', 'Kofi Asare');
      if (m.asareEvent.trustDelta && !rt.dialogueFlags?.asareTrustApplied) {
        if (!rt.dialogueFlags) rt.dialogueFlags = {};
        rt.dialogueFlags.asareTrustApplied = true;
        adjustAsareTrust(state.campaign, m.asareEvent.trustDelta);
      }
    }
  }

  updateHoldZone(rt, playerPos, dt, () => {
    state.waveTimer += dt;
    if (state.waveTimer > 4) {
      state.waveTimer = 0;
      spawnWaveEnemy();
    }
  });

  advanceWaypoints(rt, playerPos, m, state.campaign, state.conversations);

  const radio = m.radioEvent;
  if (radio && !rt.radioFired && rt.waypointIndex >= (radio.triggerAtWaypoint ?? 1)) {
    rt.radioFired = true;
    state.paused = true;
    const dlg = resolveRadioEvent(rt, state.conversations);
    showOverlay(dlg?.title ?? radio.speaker ?? 'Radio', dlg?.text ?? radio.message, () => {});
  }

  if (state.phaseIvActive && shouldTriggerRiotRally(state.player, state.enemies, rt, true)) {
    triggerRiotRally();
  }
  if (rt.riotRallyTimer > 0) {
    rt.riotRallyTimer = Math.max(0, rt.riotRallyTimer - dt);
  }

  if (m.handoff && rt.courierCaptured && !rt.handoffDone) {
    if (dist(playerPos, m.handoff) < 40) {
      rt.handoffDone = true;
      if (m.asareEvent?.trustDelta) adjustAsareTrust(state.campaign, m.asareEvent.trustDelta);
      fireMissionTrigger(rt, state.conversations, m.id, 'onHandoff', 'Handoff');
      const msg = popMessage(rt);
      if (msg) {
        state.paused = true;
        showOverlay(msg.title, msg.text, () => {});
      }
    }
  }

  if (m.asareGate && state.campaign.asareTrust >= m.asareGate.trustRequired) {
    if (dist(playerPos, m.asareGate) < 50 && !rt.asareGateOpened) {
      rt.asareGateOpened = true;
      showOverlay('Asare', 'Side gate unlocked. Extract through the church route.', () => {});
    }
  }

  if (m.id === 10 && rt.witnessesDone >= 3 && !rt.tributeShown) {
    const gate = { x: 650, y: 300 };
    if (dist(playerPos, gate) < 110) {
      rt.tributeShown = true;
      sfxTribute();
      showOverlay(
        'Christiansborg Crossroads — 28 February 1948',
        'Superintendent Colin Imray and seventeen armed constables block the path to Osu Castle. Governor Gerald Creasy will not receive the petition.\n\nShots ring out at the gate. Sergeant Adjetey, Corporal Attipoe, and Private Odartey Lamptey fall.\n\nYou cannot stop what history records — but the witnesses survive, and the truth escapes with you.',
        () => {},
        'In their memory',
        m.epilogue ?? ''
      );
    }
  }

  const kwesiEvt = updateKwesiCapture(state, dt);
  if (kwesiEvt.failed) {
    state.gameOver = true;
    sfxFail();
    showOverlay(
      'Kwesi Lost',
      'The clerk vanishes into Creasy\'s files. Without his manifests, the cell goes blind.',
      () => {}
    );
    return;
  }
  if (kwesiEvt.captured && !rt.kwesiCaptureAnnounced) {
    rt.kwesiCaptureAnnounced = true;
    refreshSquadPointers();
    state.paused = true;
    showOverlay(
      'Kwesi Captured',
      'Constables have him. Switch to Kojo, Araba, or Kofi — reach Kwesi and press E to extract him before the window closes.',
      () => {}
    );
  }
  if (kwesiEvt.bark) state.kwesiStatusHint = kwesiEvt.bark;
  else if (!rt.kwesiCaptured) state.kwesiStatusHint = '';

  if (state.player.hp <= 0) {
    if (handleKwesiHit(state, state.player, rt)) {
      refreshSquadPointers();
      state.paused = true;
      showOverlay(
        'Kwesi Down',
        'Extract him with another cell member — press E at his position.',
        () => {}
      );
      return;
    }
    state.gameOver = true;
    sfxFail();
    return;
  }

  if (evaluateObjectives(rt, state) && !state.missionComplete) {
    state.missionComplete = true;
    const commendation = getCommendation(m);
    completeMission(state.campaign, m.id, m.meterGain, commendation);
    if (m.id === 10 && m.asareEvent?.trustDelta) {
      adjustAsareTrust(state.campaign, m.asareEvent.trustDelta);
    }
    queueMissionDialogue(rt, state.conversations, m.id, 'victory', 'Victory');
    if (m.id === 15) queueEpilogue(rt, state.conversations);
    sfxComplete();
    state.paused = true;
    showOverlay(
      'Mission Complete',
      `${m.victoryText}${m.epilogue ? `\n\n${m.epilogue}` : ''}`,
      () => {},
      `+${m.meterGain ?? 10}% Independence Momentum`
    );
    showCommendationOverlay(commendation);
  }
}

function update(dt) {
  if (state.phase !== 'playing' || state.paused || !state.engine) return;
  if (state.gameOver || state.missionComplete) return;

  state.Matter.Engine.update(state.engine, dt * 1000);
  updatePlayer(dt);

  state.followers.forEach((f, i) => {
    if (f.hp <= 0 || f.captured) return;
    const result = updateFollower(f, state.player, i, state.squadState, state.enemies, dt, state.Matter);
    if (result.shoot && f.canFireWeapons !== false && canCharacterFire(f.id)) {
      const pos = f.body.position;
      spawnBullet(pos.x, pos.y, result.angle, 260, true, f.radius);
    }
    clampBody(f.body, f.radius);
  });

  updateEnemies(dt);

  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.life -= dt;
    const { x, y } = b.body.position;
    if (b.life <= 0 || x < 0 || x > GAME_W || y < 0 || y > GAME_H) removeBullet(b);
  }

  updateMissionLogic(dt);
  tickWiretap(state, dt);
  tickBark(state, dt);
}

// ─── Draw ─────────────────────────────────────────────────────────────────
function drawCylinder(x, y, radius, colorIdx, angle, hp, maxHp) {
  ovalfill(x, y + radius * 0.35, radius * 0.85, radius * 0.28, 0);
  ovalfill(x, y, radius, radius * 0.72, colorIdx);
  circfill(x, y - radius * 0.1, radius * 0.65, colorIdx);
  if (angle != null) {
    circfill(x + Math.cos(angle) * (radius + 5), y + Math.sin(angle) * (radius + 5), 2, 7);
  }
  if (hp < maxHp) {
    rectfill(x - radius, y - radius - 8, radius * 2, 3, 0);
    rectfill(x - radius, y - radius - 8, radius * 2 * (hp / maxHp), 3, hp > 30 ? 2 : 8);
  }
}

function drawZone(zone, colorIdx, label) {
  if (!zone) return;
  circfill(zone.x, zone.y, zone.radius, colorIdx);
  if (label) text(zone.x - 30, zone.y - zone.radius - 8, label, 7);
}

function clearHudOverlay() {
  const canvas = document.querySelector('canvas.lc-overlay');
  const ctx = canvas?.getContext('2d');
  if (ctx) ctx.clearRect(0, 0, GAME_W, GAME_H);
  else cls(0);
}

function draw() {
  if (state.view3d) state.view3d.sync(state);

  if (state.phase === 'menu') {
    if (!state.view3d) {
      cls(0);
      text(W / 2 - 100, H / 2 - 20, 'Select mission from menu →', 7);
    }
    return;
  }

  // HUD-only overlay — 3D scene renders entities underneath
  clearHudOverlay();

  drawHUD();

  if (state.gameOver) {
    rectfill(0, 0, W, H, 0);
    text(W / 2 - 55, H / 2, 'Mission Failed', 9);
    text(W / 2 - 90, H / 2 + 20, 'Press Continue in menu', 7);
  }

  if (state.missionComplete) {
    rectfill(0, 0, W, H, 0);
    text(W / 2 - 70, H / 2 - 10, 'Mission Complete', 3);
    text(W / 2 - 100, H / 2 + 14, 'See briefing overlay', 7);
    return;
  }
}

function wrapText(str, max) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + w).length > max) { lines.push(line.trim()); line = w + ' '; }
    else line += w + ' ';
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function drawMinimap() {
  const mw = 108;
  const mh = 81;
  const mx = W - mw - 12;
  const my = 44;
  const sx = mw / GAME_W;
  const sy = mh / GAME_H;
  rectfill(mx, my, mw, mh, 0);
  rectfill(mx, my, mw, 1, 1);
  rectfill(mx, my + mh - 1, mw, 1, 1);
  rectfill(mx, my, 1, mh, 1);
  rectfill(mx + mw - 1, my, 1, mh, 1);

  const m = state.missionRuntime?.data;
  const ex = m?.extraction ?? m?.altExtraction;
  if (ex) circfill(mx + ex.x * sx, my + ex.y * sy, 3, 2);

  if (m?.holdZone) {
    const hz = m.holdZone;
    circfill(mx + hz.x * sx, my + hz.y * sy, Math.max(2, hz.radius * sx * 0.35), 4);
  }

  for (const e of state.enemies) {
    if (e.dead) continue;
    const ex = e.x ?? e.body?.position.x ?? 0;
    const ey = e.y ?? e.body?.position.y ?? 0;
    circfill(mx + ex * sx, my + ey * sy, 2, e.revealed ? 9 : 8);
  }

  for (const item of state.intelItems) {
    if (item.collected || item.locked) continue;
    circfill(mx + item.x * sx, my + item.y * sy, 2, 3);
  }

  if (state.squadUnits?.length) {
    for (const u of state.squadUnits) {
      if (u.hp <= 0) continue;
      const ux = u.body.position.x;
      const uy = u.body.position.y;
      const isPlayer = u === state.player;
      circfill(mx + ux * sx, my + uy * sy, isPlayer ? 3 : 2, isPlayer ? 3 : 7);
    }
  } else if (state.player?.body) {
    const px = state.player.body.position.x;
    const py = state.player.body.position.y;
    circfill(mx + px * sx, my + py * sy, 3, 3);
  }

  text(mx + 3, my + 10, 'MAP', 6);
}

function drawHUD() {
  const rt = state.missionRuntime;
  if (!rt) return;

  rectfill(8, 8, 240, 62, 0);
  const phase = getMissionPhase(state.campaignPhases, rt.data.id);
  if (phase) text(12, 14, phase.label, 6);
  text(12, 26, `M${rt.data.id}: ${rt.data.title}`, 7);
  text(12, 40, getObjectiveSummary(rt), 3);
  text(12, 52, `Intel ${rt.intelCollected}  KIA ${rt.enemiesKilled}${rt.loadedAssetCount ? `  Art ${rt.loadedAssetCount}` : ''}`, 7);

  rectfill(8, 72, 120, 20, 0);
  if (state.phaseIvActive) {
    text(12, 84, `Cell: ${state.player.name} (1-4 switch)`, 3);
    if (state.player.id === 'kwesi') text(130, 84, 'NO COMBAT', 9);
    if (state.player.id === 'kojo') text(130, 84, 'Tab orders', 6);
    if (state.player.id === 'kwesi') text(200, 84, state.wiretapCooldown > 0 ? 'Q wait' : 'Q wiretap', 6);
    if (rt.kwesiCaptured && !rt.kwesiRescued) {
      text(12, 98, `RESCUE KWESI ${Math.ceil(rt.kwesiRescueTimer)}s`, 9);
    } else if (state.kwesiStatusHint) {
      text(12, 98, state.kwesiStatusHint.slice(0, 42), 8);
    }
  } else {
    text(12, 84, `Asare Trust: ${state.campaign.asareTrust}`, 3);
  }

  if (rt.riotRallyTimer > 0) {
    text(W / 2 - 55, 36, 'RIOT RALLY', 9);
  }
  if (state.wiretapActive > 0) {
    text(W / 2 - 40, 48, 'WIRETAP', 3);
  }
  if (state.barkText) {
    rectfill(8, H - 72, W - 16, 22, 0);
    text(14, H - 58, state.barkText.slice(0, 90), 6);
  }

  const squadColors = { FOLLOW: 2, DEFEND: 8, ATTACK: 9 };
  rectfill(W - 130, 8, 122, 28, squadColors[state.squadState] ?? 2);
  text(W - 120, 22, `SQUAD: ${state.squadState}`, 7);
  drawMinimap();

  if (rt.holdRequired > 0) {
    const pct = Math.min(1, rt.holdTimer / rt.holdRequired);
    rectfill(W / 2 - 60, 8, 120, 10, 1);
    rectfill(W / 2 - 60, 8, 120 * pct, 10, 2);
    text(W / 2 - 30, 18, 'HOLD', 7);
  }

  rectfill(8, H - 36, W - 16, 28, 0);
  text(14, H - 22, rt.data.briefing.slice(0, 85), 7);
  text(14, H - 8, state.phaseIvActive
    ? 'WASD / joystick | F fire | E interact | 1-4 char | Tab order (Kojo) | Q wiretap (Kwesi) | Space squad'
    : 'WASD / center joystick (360°) | F fire | E interact | Space squad', 3);

  if (state.interactHint) text(W / 2 - 50, H - 50, state.interactHint, 6);
  if (canRescueKwesi(state, rt)) text(W / 2 - 70, H - 66, 'Press E — rescue Kwesi', 3);

  if (state.missionComplete) {
    text(W / 2 - 80, H - 50, '[Continue] returns to mission select', 3);
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────
function init() {
  state.overlay = document.getElementById('overlay');
  state.overlayTitle = document.getElementById('overlay-title');
  state.overlaySubtitle = document.getElementById('overlay-subtitle');
  state.overlayCommendation = document.getElementById('overlay-commendation');
  state.overlayText = document.getElementById('overlay-text');
  state.touchUi = document.getElementById('touch-ui');
  setTouchUiVisible(false);

  state.Matter = Matter;
  state.engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
  state.world = state.engine.world;
  Matter.Events.on(state.engine, 'collisionStart', (ev) => {
    for (const pair of ev.pairs) handleCollision(pair.bodyA, pair.bodyB);
  });

  Promise.all([
    fetch('./src/missions.json').then((r) => r.json()),
    fetch('./src/history.json').then((r) => r.json()).catch(() => ({})),
    fetch('./src/youth-squad.json').then((r) => r.json()).catch(() => null),
    fetch('./src/conversations.json').then((r) => r.json()).catch(() => null),
    fetch('./src/accra-freedom-grid.json').then((r) => r.json()).catch(() => null),
    fetch('./src/yaw-hub.json').then((r) => r.json()).catch(() => null),
    loadAssetManifest(),
    loadLeonardoExportMap(),
  ]).then(([missionsData, history, youthSquad, conversations, freedomGrid, yawHubData, assetManifest, leonardoExportMap]) => {
    state.missions = missionsData.missions;
    state.asareConfig = missionsData.asare;
    state.campaignPhases = missionsData.campaignPhases ?? [];
    state.historicalFigures = missionsData.historicalFigures ?? null;
    state.commanderName = missionsData.commander ?? 'Dr. Kwame Nkrumah';
    state.youthSquad = youthSquad;
    state.conversations = conversations;
    state.freedomGrid = freedomGrid;
    state.yawHubData = yawHubData;
    state.leonardoExportMap = leonardoExportMap;
    clearTextureCache();
    state.assetManifest = assetManifest;
    state.campaign = loadSave(missionsData.asare);
    document.title = missionsData.campaignTitle ?? history.title;
    playPrologueThenMenu();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  setupInput();
  setStateRef(state);

  const canvas = document.querySelector('canvas');
  const wrapper = document.getElementById('game-wrapper');
  if (wrapper) {
    state.view3d = createGameView3D(wrapper, GAME_W, GAME_H);
    state.view3d.domElement.classList.add('view3d');
  }
  if (canvas && wrapper) {
    canvas.classList.add('lc-overlay');
    wrapper.appendChild(canvas);
  }

  document.getElementById('overlay-close').addEventListener('click', () => {
    const completedId = state.missionComplete ? state.currentMissionId : null;
    if (state.missionComplete) state.missionComplete = false;
    closeOverlay();
    if (completedId === 10 || (completedId && isPhaseIvMission(completedId))) {
      openYawHub();
      return;
    }
    if (state.gameOver) {
      state.gameOver = false;
      renderMissionMenu();
    }
  });

  document.getElementById('btn-yaw-hub')?.addEventListener('click', () => openYawHub());
  document.getElementById('hub-close-btn')?.addEventListener('click', () => {
    closeYawHub();
    renderMissionMenu();
  });
  document.getElementById('hub-deploy-btn')?.addEventListener('click', () => deployFromHub());

  pal([
    '#2a3d2a', '#243524', '#006b3f', '#c9a227', '#228b22',
    '#1a1a4e', '#ffd700', '#e8e4d4', '#8b0000', '#ff4444', '#8b7355',
  ]);
}

function tapped() {
  if (state.missionComplete || state.gameOver) {
    renderMissionMenu();
    state.missionComplete = false;
    state.gameOver = false;
  }
}

litecanvas({
  width: GAME_W,
  height: GAME_H,
  loop: { init, update, draw, tapped },
});
