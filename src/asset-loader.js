/**
 * Data-lite asset loader — Leonardo textures → Three.js billboards.
 * Missing files fall back gracefully (procedural geometry only).
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

let manifestCache = null;
const textureCache = new Map();

export async function loadAssetManifest() {
  if (manifestCache) return manifestCache;
  try {
    const res = await fetch('./assets/manifest.json');
    manifestCache = res.ok ? await res.json() : { assets: [], missionAssets: {} };
  } catch {
    manifestCache = { assets: [], missionAssets: {} };
  }
  return manifestCache;
}

export function getAssetById(manifest, id) {
  return manifest?.assets?.find((a) => a.id === id) ?? null;
}

export function getMissionAssetIds(manifest, missionId) {
  return manifest?.missionAssets?.[String(missionId)] ?? [];
}

export function textureUrlForAsset(asset) {
  if (!asset?.path) return null;
  return `./assets/textures/${asset.path}`;
}

export function loadTexture(url) {
  if (!url) return Promise.resolve(null);
  if (textureCache.has(url)) {
    const cached = textureCache.get(url);
    return Promise.resolve(cached);
  }
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        textureCache.set(url, tex);
        resolve(tex);
      },
      undefined,
      () => resolve(null)
    );
  });
}

/** @returns {Promise<Record<string, { asset: object, texture: THREE.Texture }>>} */
export async function loadMissionTextures(manifest, missionId) {
  const ids = getMissionAssetIds(manifest, missionId);
  const out = {};
  await Promise.all(ids.map(async (id) => {
    const asset = getAssetById(manifest, id);
    if (!asset) return;
    const url = textureUrlForAsset(asset);
    const texture = await loadTexture(url);
    if (texture) out[id] = { asset, texture };
  }));
  return out;
}

export function countLoadedTextures(map) {
  return Object.keys(map ?? {}).length;
}
