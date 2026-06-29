/**
 * Three.js 3D world view — terrain, structures, and cylindrical characters.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {
  createTerrainSampler,
  createTerrainMesh,
  createStructure,
  createIntelMarker,
  createBeacon,
  scatterEnvironment,
  createBoundaryRidge,
  createMissionLandmarks,
} from './world3d.js';

const PALETTE = [
  0x2a3d2a, 0x243524, 0x006b3f, 0xc9a227, 0x228b22,
  0x1a1a4e, 0xffd700, 0xe8e4d4, 0x8b0000, 0xff4444, 0x8b7355,
];

function colorAt(idx) {
  return PALETTE[idx] ?? 0x888888;
}

function makeCylinderMesh(radius, bodyColor, capColor) {
  const height = radius * 3;
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.9, radius, height, 16),
    new THREE.MeshStandardMaterial({
      color: bodyColor,
      roughness: 0.55,
      metalness: 0.15,
      emissive: bodyColor,
      emissiveIntensity: 0.12,
    })
  );
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.72, radius * 0.85, radius * 0.35, 16),
    new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.5, metalness: 0.15 })
  );
  cap.position.y = height + radius * 0.12;
  cap.castShadow = true;
  group.add(cap);

  const aim = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 0.35, radius * 0.2, radius * 0.9),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })
  );
  aim.position.set(radius * 1.1, height * 0.55, 0);
  aim.name = 'aim';
  group.add(aim);

  group.userData.baseHeight = height + radius * 0.3;
  return group;
}

function makeBulletMesh() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x664400, emissiveIntensity: 0.4 })
  );
}

export function createGameView3D(container, worldW, worldH) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87a8c4);
  scene.fog = new THREE.FogExp2(0x9ab0c4, 0.0011);

  const terrainSampler = createTerrainSampler(worldW, worldH);
  const { sampleHeight } = terrainSampler;

  const aspect = worldW / worldH;
  const camera = new THREE.PerspectiveCamera(46, aspect, 1, 2800);
  const camTarget = new THREE.Vector3(worldW / 2, 12, worldH / 2);
  camera.position.set(worldW * 0.42, worldW * 0.52, worldH * 1.02);
  camera.lookAt(camTarget);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(worldW, worldH);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.insertBefore(renderer.domElement, container.firstChild);

  const hemi = new THREE.HemisphereLight(0xdce8f0, 0x2a3828, 0.62);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff2d0, 1.05);
  sun.position.set(worldW * 0.25, worldW * 0.75, worldH * 0.15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -worldW * 0.7;
  sun.shadow.camera.right = worldW * 0.7;
  sun.shadow.camera.top = worldH * 0.7;
  sun.shadow.camera.bottom = -worldH * 0.7;
  sun.shadow.camera.near = 20;
  sun.shadow.camera.far = 1600;
  scene.add(sun);

  scene.add(createTerrainMesh(worldW, worldH, sampleHeight));
  scene.add(createBoundaryRidge(worldW, worldH, sampleHeight));

  let environmentGroup = null;
  let landmarkGroup = null;
  let worldKey = '';
  let missionTextures = {};

  const actors = new Map();
  const bullets = new Map();
  const zones = new Map();
  const obstacles = new Map();
  const markers = new Map();
  let obstacleKey = '';

  function rebuildWorld(obstacleList, missionId) {
    const key = `${missionId ?? 0}:${JSON.stringify(obstacleList)}`;
    if (key === worldKey) return;
    worldKey = key;
    if (environmentGroup) scene.remove(environmentGroup);
    if (landmarkGroup) scene.remove(landmarkGroup);
    environmentGroup = scatterEnvironment(scene, worldW, worldH, sampleHeight, obstacleList);
    landmarkGroup = createMissionLandmarks(
      missionId, worldW, worldH, sampleHeight, missionTextures
    );
    scene.add(landmarkGroup);
  }

  function setMissionTextures(textureMap) {
    missionTextures = textureMap ?? {};
    worldKey = '';
  }

  function placeOnGround(object, x, z, yOffset = 0) {
    object.position.set(x, sampleHeight(x, z) + yOffset, z);
  }

  function getActor(key) {
    if (!actors.has(key)) actors.set(key, { mesh: null, radius: 12 });
    return actors.get(key);
  }

  function setActor(key, x, z, radius, colorIdx, angle, visible = true) {
    const entry = getActor(key);
    entry.radius = radius;
    if (!entry.mesh) {
      const bodyColor = colorAt(colorIdx);
      const cap = new THREE.Color(bodyColor);
      cap.lerp(new THREE.Color(0xffffff), 0.22);
      entry.mesh = makeCylinderMesh(radius, bodyColor, cap.getHex());
      scene.add(entry.mesh);
    }
    entry.mesh.visible = visible;
    if (!visible) return;
    placeOnGround(entry.mesh, x, z);
    entry.mesh.rotation.y = -(angle ?? 0) + Math.PI / 2;
  }

  function clearActors(keepKeys) {
    for (const [key, entry] of actors) {
      if (keepKeys.has(key)) continue;
      if (entry.mesh) scene.remove(entry.mesh);
      actors.delete(key);
    }
  }

  function syncBullets(gameBullets) {
    const live = new Set();
    for (let i = 0; i < gameBullets.length; i++) {
      const b = gameBullets[i];
      const key = `b${i}`;
      live.add(key);
      let mesh = bullets.get(key);
      if (!mesh) {
        mesh = makeBulletMesh();
        bullets.set(key, mesh);
        scene.add(mesh);
      }
      const { x, y } = b.body.position;
      const ground = sampleHeight(x, y);
      mesh.position.set(x, ground + 14, y);
      mesh.material.color.setHex(b.fromPlayer ? 0xffd700 : 0xff4444);
    }
    for (const [key, mesh] of bullets) {
      if (!live.has(key)) {
        scene.remove(mesh);
        bullets.delete(key);
      }
    }
  }

  function syncZones(missionRuntime) {
    const live = new Set();
    const m = missionRuntime?.data;
    if (!m) {
      for (const [, group] of zones) scene.remove(group);
      zones.clear();
      return;
    }

    const addZone = (id, zone, color) => {
      if (!zone) return;
      live.add(id);
      let group = zones.get(id);
      if (!group) {
        group = createBeacon(zone.x, zone.y, zone.radius, color, sampleHeight);
        zones.set(id, group);
        scene.add(group);
      }
      placeOnGround(group, zone.x, zone.y);
    };

    addZone('extract', m.extraction, 0x006b3f);
    addZone('alt', m.altExtraction, 0x228b22);
    if (m.holdZone) {
      addZone('hold', m.holdZone, missionRuntime.holdActive ? 0xc9a227 : 0x4a4035);
    }

    for (const [id, group] of zones) {
      if (!live.has(id)) {
        scene.remove(group);
        zones.delete(id);
      }
    }
  }

  function syncObstacles(obstacleList) {
    const key = JSON.stringify(obstacleList);
    if (key === obstacleKey) return;
    obstacleKey = key;
    for (const group of obstacles.values()) scene.remove(group);
    obstacles.clear();
    for (let i = 0; i < obstacleList.length; i++) {
      const [x, y, w, h] = obstacleList[i];
      const group = createStructure(x, y, w, h, sampleHeight);
      obstacles.set(`o${i}`, group);
      scene.add(group);
    }
  }

  function syncMarkers(gameState) {
    const live = new Set();

    for (const item of gameState.intelItems ?? []) {
      if (item.collected || item.locked) continue;
      const key = `intel-${item.x}-${item.y}`;
      live.add(key);
      if (!markers.has(key)) {
        const group = createIntelMarker(item.x, item.y, sampleHeight);
        markers.set(key, group);
        scene.add(group);
      }
    }

    for (const cp of gameState.checkpoints ?? []) {
      const key = `cp-${cp.x}-${cp.y}`;
      live.add(key);
      if (!markers.has(key)) {
        const pole = new THREE.Group();
        const ground = sampleHeight(cp.x, cp.y);
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 2, 22, 6),
          new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 })
        );
        post.position.y = 11;
        post.castShadow = true;
        pole.add(post);
        const flag = new THREE.Mesh(
          new THREE.BoxGeometry(10, 6, 0.4),
          new THREE.MeshStandardMaterial({ color: 0xc9a227, emissive: 0x664400, emissiveIntensity: 0.2 })
        );
        flag.position.set(5, 18, 0);
        pole.add(flag);
        pole.position.set(cp.x, ground, cp.y);
        markers.set(key, pole);
        scene.add(pole);
      }
    }

    for (const [key, group] of markers) {
      if (!live.has(key)) {
        scene.remove(group);
        markers.delete(key);
      }
    }
  }

  function sync(gameState) {
    if (gameState.phase === 'menu') {
      renderer.render(scene, camera);
      return;
    }

    const missionId = gameState.missionRuntime?.data?.id;
    rebuildWorld(gameState.obstacles ?? [], missionId);

    const keep = new Set();
    syncObstacles(gameState.obstacles ?? []);
    syncZones(gameState.missionRuntime);
    syncMarkers(gameState);
    syncBullets(gameState.bullets);

    if (gameState.player?.hp > 0) {
      const key = 'player';
      keep.add(key);
      const p = gameState.player.body.position;
      setActor(key, p.x, p.y, gameState.player.radius, gameState.player.colorIdx ?? 2, gameState.player.angle, true);
    } else {
      keep.add('player');
      setActor('player', 0, 0, 14, 2, 0, false);
    }

    gameState.followers.forEach((f, i) => {
      const key = `f${i}`;
      keep.add(key);
      if (f.hp <= 0) {
        setActor(key, 0, 0, f.radius, i === 0 ? 3 : 4, 0, false);
        return;
      }
      const p = f.body.position;
      const colorIdx = f.colorIdx ?? (i === 0 ? 3 : i === 1 ? 4 : 10);
      setActor(key, p.x, p.y, f.radius, colorIdx, f.angle, true);
    });

    gameState.enemies.forEach((e, i) => {
      const key = `e${i}`;
      keep.add(key);
      if (e.dead) {
        setActor(key, 0, 0, e.radius, 5, 0, false);
        return;
      }
      const p = e.body.position;
      setActor(key, p.x, p.y, e.radius, e.isCourier ? 9 : 5, e.angle, true);
    });

    if (gameState.asareNpc) {
      const key = 'asare';
      keep.add(key);
      setActor(key, gameState.asareNpc.x, gameState.asareNpc.y, 12, 3, 0, true);
    }

    gameState.escorts.forEach((esc, i) => {
      const key = `esc${i}`;
      keep.add(key);
      if (esc.dead) {
        setActor(key, 0, 0, esc.radius, 10, 0, false);
        return;
      }
      setActor(key, esc.x, esc.y, esc.radius, esc.cart ? 3 : esc.vip ? 6 : 10, 0, true);
    });

    clearActors(keep);
    renderer.render(scene, camera);
  }

  function resize(w, h) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function dispose() {
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }

  return { sync, resize, dispose, setMissionTextures, domElement: renderer.domElement };
}
