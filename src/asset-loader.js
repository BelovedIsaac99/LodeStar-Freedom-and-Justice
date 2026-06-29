/**
 * Data-lite asset loader — Leonardo textures → Three.js billboards.
 * Falls back to images/leonardo export/ when assets/textures/ missing.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

let manifestCache = null;
let exportMapCache = null;
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

export async function loadLeonardoExportMap() {
  if (exportMapCache) return exportMapCache;
  try {
    const res = await fetch('./assets/leonardo-export-map.json');
    exportMapCache = res.ok ? await res.json() : { exportBase: 'images/leonardo export/', assets: {}, missionScenes: {} };
  } catch {
    exportMapCache = { exportBase: 'images/leonardo export/', assets: {}, missionScenes: {} };
  }
  return exportMapCache;
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

function encodeAssetPath(base, rel, version) {
  if (!rel) return null;
  const parts = rel.split('/').map((p) => encodeURIComponent(p));
  const path = `./${base.replace(/\/$/, '')}/${parts.join('/')}`;
  return version ? `${path}?v=${version}` : path;
}

export function exportUrlForAssetId(exportMap, assetId) {
  const rel = exportMap?.assets?.[assetId];
  if (!rel) return null;
  return encodeAssetPath(exportMap.exportBase ?? 'images/leonardo export/', rel, exportMap.version);
}

export function getMissionSceneUrl(exportMap, missionId) {
  const rel = exportMap?.missionScenes?.[String(missionId)];
  if (!rel) return null;
  return encodeAssetPath(exportMap.exportBase ?? 'images/leonardo export/', rel, exportMap.version);
}

export function getStrategyMapUrl(exportMap) {
  const rel = exportMap?.strategyMap;
  if (!rel) return null;
  return encodeAssetPath(exportMap.exportBase ?? 'images/leonardo export/', rel, exportMap.version);
}

export function getCoverArtUrl(exportMap) {
  const rel = exportMap?.coverArt;
  if (!rel) return null;
  return encodeAssetPath(exportMap.exportBase ?? 'images/leonardo export/', rel, exportMap.version);
}

export function loadTexture(url) {
  if (!url) return Promise.resolve(null);
  if (textureCache.has(url)) {
    return Promise.resolve(textureCache.get(url));
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

/** Clear cached textures after Leonardo export updates (version bump in export map). */
export function clearTextureCache() {
  for (const tex of textureCache.values()) {
    tex?.dispose?.();
  }
  textureCache.clear();
}

async function loadTextureWithFallback(asset, exportMap) {
  const primary = textureUrlForAsset(asset);
  let texture = await loadTexture(primary);
  if (!texture && asset?.id) {
    texture = await loadTexture(exportUrlForAssetId(exportMap, asset.id));
  }
  return texture;
}

/** @returns {Promise<Record<string, { asset: object, texture: THREE.Texture }>>} */
export async function loadMissionTextures(manifest, missionId, exportMap) {
  const map = exportMap ?? await loadLeonardoExportMap();
  const ids = getMissionAssetIds(manifest, missionId);
  const out = {};
  await Promise.all(ids.map(async (id) => {
    const asset = getAssetById(manifest, id);
    if (!asset) return;
    const texture = await loadTextureWithFallback(asset, map);
    if (texture) out[id] = { asset, texture };
  }));
  return out;
}

export function countLoadedTextures(textureMap) {
  return Object.keys(textureMap ?? {}).length;
}
