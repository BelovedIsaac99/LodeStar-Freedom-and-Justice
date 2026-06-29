/**
 * Procedural 3D terrain and environment meshes for the Accra campaign map.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x, z) {
  let value = 0;
  let amp = 1;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    value += smoothNoise(x * freq, z * freq) * amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return value;
}

export function createTerrainSampler(worldW, worldH) {
  const scaleX = 4.5 / worldW;
  const scaleZ = 4.5 / worldH;

  function sampleHeight(x, z) {
    const nx = x * scaleX;
    const nz = z * scaleZ;
    const ridge = Math.sin(nx * Math.PI * 1.6) * Math.cos(nz * Math.PI * 1.4) * 22;
    const rolling = fbm(nx * 2.8, nz * 2.8) * 28 - 14;
    const detail = fbm(nx * 7.5 + 12, nz * 7.5 + 4) * 6 - 3;
    const edge = Math.min(x, z, worldW - x, worldH - z);
    const edgeFall = edge < 55 ? (55 - edge) * 0.35 : 0;
    return Math.max(2, 10 + ridge + rolling + detail - edgeFall);
  }

  return { sampleHeight };
}

export function createTerrainMesh(worldW, worldH, sampleHeight) {
  const segsX = 80;
  const segsZ = 60;
  const geo = new THREE.PlaneGeometry(worldW, worldH, segsX, segsZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = [];
  const low = new THREE.Color(0x1a2a18);
  const mid = new THREE.Color(0x243824);
  const high = new THREE.Color(0x2f4a2c);
  const path = new THREE.Color(0x3a3428);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + worldW / 2;
    const z = pos.getZ(i) + worldH / 2;
    const y = sampleHeight(x, z);
    pos.setY(i, y);

    const t = (y - 2) / 42;
    const c = mid.clone().lerp(high, t);
    if (Math.abs(z - worldH * 0.5) < 22 && y < 18) c.lerp(path, 0.55);
    if (y < 12) c.lerp(low, 0.35);
    colors.push(c.r, c.g, c.b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02,
      flatShading: false,
    })
  );
  mesh.position.set(worldW / 2, 0, worldH / 2);
  mesh.receiveShadow = true;
  return mesh;
}

function wallMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x4a4035, roughness: 0.88, metalness: 0.05 });
}

function roofMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.8, metalness: 0.08 });
}

export function createStructure(x, z, w, d, sampleHeight) {
  const group = new THREE.Group();
  const ground = sampleHeight(x, z);
  const isWall = w < 24 || d < 24;
  const span = Math.max(w, d);
  const thickness = Math.min(w, d);

  if (isWall) {
    const wallH = 34 + (span % 17);
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(span, wallH, thickness + 4),
      wallMaterial()
    );
    wall.position.y = wallH / 2;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(span + 2, 3, thickness + 6),
      roofMaterial()
    );
    cap.position.y = wallH + 1.5;
    cap.castShadow = true;
    group.add(cap);
  } else {
    const baseH = 28 + (span % 20);
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.92, baseH, d * 0.92),
      wallMaterial()
    );
    base.position.y = baseH / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(w, d) * 0.62, 18, 4),
      roofMaterial()
    );
    roof.position.y = baseH + 9;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);
  }

  group.position.set(x, ground, z);
  return group;
}

export function createTree(x, z, sampleHeight) {
  const group = new THREE.Group();
  const ground = sampleHeight(x, z);
  const trunkH = 10 + hash2(x, z) * 8;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(1.4, 2.2, trunkH, 6),
    new THREE.MeshStandardMaterial({ color: 0x3d2e1f, roughness: 0.9 })
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  group.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(7 + hash2(z, x) * 4, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x1f4d28, roughness: 0.85 })
  );
  canopy.position.y = trunkH + 5;
  canopy.castShadow = true;
  group.add(canopy);

  group.position.set(x, ground, z);
  return group;
}

export function createIntelMarker(x, z, sampleHeight) {
  const ground = sampleHeight(x, z);
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 6, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a4035, roughness: 0.8 })
  );
  base.position.y = 1.5;
  group.add(base);

  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(8, 12, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xc9a227,
      emissiveIntensity: 0.65,
      roughness: 0.35,
    })
  );
  glow.position.y = 9;
  glow.castShadow = true;
  group.add(glow);

  group.position.set(x, ground, z);
  return group;
}

export function createBeacon(x, z, radius, color, sampleHeight) {
  const ground = sampleHeight(x, z);
  const group = new THREE.Group();

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.05, 2.5, 24),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.35 })
  );
  pad.position.y = 1.25;
  group.add(pad);

  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 3.5, 28, 8),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.25,
      roughness: 0.45,
    })
  );
  pillar.position.y = 16;
  pillar.castShadow = true;
  group.add(pillar);

  const light = new THREE.PointLight(color, 0.55, radius * 2.2);
  light.position.y = 24;
  group.add(light);

  group.position.set(x, ground, z);
  return group;
}

export function scatterEnvironment(scene, worldW, worldH, sampleHeight, obstacleList = []) {
  const props = new THREE.Group();
  const blocked = obstacleList.map(([x, y]) => ({ x, y, r: 40 }));

  function tooClose(x, z) {
    return blocked.some((b) => Math.hypot(x - b.x, z - b.y) < b.r);
  }

  for (let i = 0; i < 42; i++) {
    const x = 40 + hash2(i, 1.7) * (worldW - 80);
    const z = 40 + hash2(i, 2.3) * (worldH - 80);
    if (tooClose(x, z)) continue;
    if (sampleHeight(x, z) > 30) continue;
    props.add(createTree(x, z, sampleHeight));
  }

  for (let i = 0; i < 16; i++) {
    const x = 50 + hash2(i + 40, 3.1) * (worldW - 100);
    const z = 50 + hash2(i + 40, 4.2) * (worldH - 100);
    if (tooClose(x, z)) continue;
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(8, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 0.9 })
    );
    crate.position.set(x, sampleHeight(x, z) + 3, z);
    crate.rotation.y = hash2(x, z) * Math.PI;
    crate.castShadow = true;
    props.add(crate);
  }

  scene.add(props);
  return props;
}

export function createBoundaryRidge(worldW, worldH, sampleHeight) {
  const group = new THREE.Group();
  const wallH = 26;
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a3328, roughness: 0.95 });
  const segments = [
    [worldW / 2, 8, worldW, 16],
    [worldW / 2, worldH - 8, worldW, 16],
    [8, worldH / 2, 16, worldH],
    [worldW - 8, worldH / 2, 16, worldH],
  ];

  for (const [x, z, w, d] of segments) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), mat);
    mesh.position.set(x, sampleHeight(x, z) + wallH / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return group;
}

const LANDMARK_COLORS = {
  market: 0xc9a227,
  awam: 0x8b0000,
  warehouse: 0x4a4035,
  secretariat: 0x1a1a4e,
  yard: 0x006b3f,
};

function createLandmarkSign(x, z, label, color, sampleHeight, height = 38) {
  const group = new THREE.Group();
  const ground = sampleHeight(x, z);
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2.5, height, 6),
    new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 0.85 })
  );
  pole.position.y = height / 2;
  pole.castShadow = true;
  group.add(pole);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(28, 14, 2),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.15,
      roughness: 0.7,
    })
  );
  board.position.set(0, height + 6, 0);
  board.castShadow = true;
  group.add(board);

  group.position.set(x, ground, z);
  group.userData.landmarkLabel = label;
  return group;
}

/** Leonardo texture billboard — data-lite prop placement */
export function createTexturedBillboard(x, z, width, height, texture, sampleHeight, rotY = 0) {
  const group = new THREE.Group();
  const ground = sampleHeight(x, z);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    roughness: 0.92,
    metalness: 0.02,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  mesh.position.y = height * 0.5;
  mesh.rotation.y = rotY;
  mesh.castShadow = true;
  group.add(mesh);
  group.position.set(x, ground, z);
  return group;
}

export function createWallDecal(x, z, width, height, texture, sampleHeight, rotY = 0) {
  return createTexturedBillboard(x, z, width, height, texture, sampleHeight, rotY);
}

function createAwamStore(x, z, sampleHeight, texture = null) {
  if (texture) {
    return createTexturedBillboard(x, z, 58, 42, texture, sampleHeight);
  }
  const group = new THREE.Group();
  const ground = sampleHeight(x, z);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(55, 32, 40),
    new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.9 })
  );
  base.position.y = 16;
  base.castShadow = true;
  group.add(base);

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(40, 10, 1),
    new THREE.MeshStandardMaterial({
      color: 0x8b0000,
      emissive: 0x440000,
      emissiveIntensity: 0.3,
    })
  );
  sign.position.set(0, 38, 21);
  group.add(sign);

  group.position.set(x, ground, z);
  return group;
}

function createMotorYard(x, z, sampleHeight, workshopTex = null, truckTex = null) {
  const group = new THREE.Group();
  const ground = sampleHeight(x, z);

  if (workshopTex) {
    group.add(createTexturedBillboard(0, -20, 75, 45, workshopTex, (a, b) => ground, 0));
  } else {
    const shed = new THREE.Mesh(
      new THREE.BoxGeometry(70, 28, 50),
      new THREE.MeshStandardMaterial({ color: 0x2a3328, roughness: 0.92, transparent: true, opacity: 0.85 })
    );
    shed.position.set(0, 14, -30);
    group.add(shed);
  }

  if (truckTex) {
    const truckBill = createTexturedBillboard(-15, 0, 52, 28, truckTex, (a, b) => ground, Math.PI / 2);
    group.add(truckBill);
  } else {
    const truck = new THREE.Mesh(
      new THREE.BoxGeometry(50, 22, 24),
      new THREE.MeshStandardMaterial({ color: 0x4a4035, roughness: 0.88 })
    );
    truck.position.set(-15, 11, 0);
    truck.castShadow = true;
    group.add(truck);
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(18, 20, 22),
      new THREE.MeshStandardMaterial({ color: 0x5c3d28, roughness: 0.85 })
    );
    cab.position.set(22, 12, 0);
    cab.castShadow = true;
    group.add(cab);
  }

  group.position.set(x, ground, z);
  return group;
}

function addBritishProps(group, tex, sampleHeight, x, z) {
  if (tex('lee-enfield-no4')) {
    group.add(createTexturedBillboard(x, z, 22, 8, tex('lee-enfield-no4'), sampleHeight, -0.4));
  }
  if (tex('curfew-broadside')) {
    group.add(createWallDecal(x + 40, z, 18, 24, tex('curfew-broadside'), sampleHeight));
  }
}

function addResistanceProps(group, tex, sampleHeight, x, z) {
  if (tex('hooked-iron-rod')) {
    group.add(createTexturedBillboard(x, z, 14, 18, tex('hooked-iron-rod'), sampleHeight, 0.2));
  }
  if (tex('accra-evening-news')) {
    group.add(createTexturedBillboard(x + 25, z, 16, 12, tex('accra-evening-news'), sampleHeight, -0.1));
  }
}

/** Mission-specific 3D landmarks for Accra districts */
export function createMissionLandmarks(missionId, worldW, worldH, sampleHeight, missionTextures = {}) {
  const group = new THREE.Group();
  if (!missionId) return group;

  const tex = (id) => missionTextures[id]?.texture ?? null;

  const presets = {
    10: () => {
      if (tex('crossroads-checkpoint')) {
        group.add(createTexturedBillboard(650, 300, 100, 55, tex('crossroads-checkpoint'), sampleHeight));
      } else {
        group.add(createLandmarkSign(650, 300, 'Crossroads', LANDMARK_COLORS.secretariat, sampleHeight, 52));
        group.add(createStructure(580, 280, 16, 80, sampleHeight));
      }
      if (tex('veteran-adjetey')) {
        group.add(createTexturedBillboard(120, 280, 10, 20, tex('veteran-adjetey'), sampleHeight));
      }
      if (tex('veteran-attipoe')) {
        group.add(createTexturedBillboard(135, 310, 10, 20, tex('veteran-attipoe'), sampleHeight, 0.15));
      }
      if (tex('veteran-lamptey')) {
        group.add(createTexturedBillboard(105, 320, 10, 20, tex('veteran-lamptey'), sampleHeight, -0.1));
      }
      addBritishProps(group, tex, sampleHeight, 520, 260);
      if (tex('veteran-marcher')) {
        group.add(createTexturedBillboard(150, 300, 12, 22, tex('veteran-marcher'), sampleHeight));
      }
      if (tex('bedford-oy-truck')) {
        group.add(createTexturedBillboard(400, 180, 48, 26, tex('bedford-oy-truck'), sampleHeight, Math.PI / 2));
      }
    },
    11: () => {
      if (tex('accra-aerial-map')) {
        group.add(createTexturedBillboard(worldW * 0.5, worldH * 0.48, worldW * 0.75, worldH * 0.42, tex('accra-aerial-map'), sampleHeight, 0));
      }
      if (tex('salaga-market')) {
        group.add(createTexturedBillboard(worldW * 0.45, worldH * 0.42, 95, 52, tex('salaga-market'), sampleHeight));
      } else {
        group.add(createLandmarkSign(worldW * 0.45, worldH * 0.42, 'Makola', LANDMARK_COLORS.market, sampleHeight));
      }
      for (let i = 0; i < 5; i++) {
        const sx = 180 + i * 45;
        const sz = 220 + (i % 2) * 30;
        group.add(createStructure(sx, sz, 22, 18, sampleHeight));
      }
      addResistanceProps(group, tex, sampleHeight, 200, 250);
    },
    12: () => {
      group.add(createAwamStore(520, 300, sampleHeight, tex('awam-store-front')));
      if (tex('salaga-market')) {
        group.add(createTexturedBillboard(350, 320, 90, 48, tex('salaga-market'), sampleHeight));
      } else {
        group.add(createLandmarkSign(350, 320, 'Salaga', LANDMARK_COLORS.market, sampleHeight));
      }
      group.add(createStructure(180, 260, 20, 16, sampleHeight));
      group.add(createStructure(200, 380, 20, 16, sampleHeight));
      if (tex('market-woman')) {
        group.add(createTexturedBillboard(190, 270, 10, 20, tex('market-woman'), sampleHeight));
      }
      addResistanceProps(group, tex, sampleHeight, 480, 320);
    },
    13: () => {
      if (tex('kaneshie-warehouse')) {
        group.add(createTexturedBillboard(400, 300, 88, 50, tex('kaneshie-warehouse'), sampleHeight));
      } else {
        group.add(createLandmarkSign(400, 300, 'Kaneshie', LANDMARK_COLORS.warehouse, sampleHeight, 44));
      }
      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(18, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.35 })
      );
      smoke.position.set(220, sampleHeight(220, 200) + 40, 200);
      group.add(smoke);
      group.add(createStructure(250, 300, 70, 16, sampleHeight));
      if (tex('dane-gun')) {
        group.add(createTexturedBillboard(280, 340, 20, 10, tex('dane-gun'), sampleHeight, 0.5));
      }
      if (tex('mammy-truck')) {
        group.add(createTexturedBillboard(600, 350, 50, 28, tex('mammy-truck'), sampleHeight, -0.3));
      }
    },
    14: () => {
      if (tex('planning-room')) {
        group.add(createTexturedBillboard(450, 300, 100, 55, tex('planning-room'), sampleHeight));
      } else if (tex('colonial-secretariat')) {
        group.add(createTexturedBillboard(450, 300, 105, 58, tex('colonial-secretariat'), sampleHeight));
      } else {
        group.add(createLandmarkSign(450, 300, 'Secretariat', LANDMARK_COLORS.secretariat, sampleHeight, 50));
      }
      group.add(createStructure(280, 300, 16, 100, sampleHeight));
      group.add(createStructure(500, 300, 80, 16, sampleHeight));
      addBritishProps(group, tex, sampleHeight, 320, 280);
      if (tex('yaw-toolkit')) {
        group.add(createTexturedBillboard(180, 320, 14, 12, tex('yaw-toolkit'), sampleHeight));
      }
    },
    15: () => {
      group.add(createMotorYard(400, 300, sampleHeight, tex('ussher-workshop'), tex('mammy-truck')));
      if (tex('ussher-garage')) {
        group.add(createTexturedBillboard(400, 300, 110, 60, tex('ussher-garage'), sampleHeight));
      }
      group.add(createLandmarkSign(400, 380, 'Ussher Yard', LANDMARK_COLORS.yard, sampleHeight, 42));
      if (tex('kojo')) {
        group.add(createTexturedBillboard(360, 320, 10, 20, tex('kojo'), sampleHeight));
      }
      if (tex('araba')) {
        group.add(createTexturedBillboard(440, 320, 10, 20, tex('araba'), sampleHeight, 0.2));
      }
      if (tex('bedford-oy-truck')) {
        group.add(createTexturedBillboard(150, 200, 48, 26, tex('bedford-oy-truck'), sampleHeight, 0.6));
      }
      if (tex('austin-police-car')) {
        group.add(createTexturedBillboard(650, 420, 36, 18, tex('austin-police-car'), sampleHeight, -0.5));
      }
      addResistanceProps(group, tex, sampleHeight, 420, 340);
    },
  };

  presets[missionId]?.();
  return group;
}
