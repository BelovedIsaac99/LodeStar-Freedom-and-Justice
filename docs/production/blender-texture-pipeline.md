# Blender texture pipeline — data-lite 3D

Leonardo.ai generates **high-detail reference sheets**. The web POC keeps file sizes small by projecting that detail onto **simple geometry**.

## Workflow

```
Leonardo.ai Pro  →  PNG/WebP concept sheet
        ↓
Blender          →  Low-poly mesh (box, plane, or traced silhouette)
        ↓
UV unwrap        →  Single tile; hero assets may use 2K, props 512–1K
        ↓
Bake / project   →  Diffuse (+ optional normal for hero only)
        ↓
Export           →  WebP to assets/textures/  OR  GLB to assets/models/
        ↓
Game             →  asset-loader.js + world3d billboards
```

## Poly budgets (web POC)

| Tier | Tris | Examples |
|------|------|----------|
| Billboard | 2 (1 plane) | Weapons, newspapers, character sheets |
| Low prop | 50–200 | Crates, stall, guard shack blockout |
| Hero environment | 500–2K | Crossroads checkpoint, Secretariat facade |
| Vehicle | 300–800 | Bedford OY, mammy truck |

## Faction material notes

**British:** Slightly higher specular on metal and black paint; cooler color grade.  
**Resistance:** Warmer laterite tones; higher roughness on wood and iron; wax print = saturated albedo, low metalness.

## Blender steps (single prop)

1. Import Leonardo sheet as reference image plane.
2. Model simple mesh to silhouette (e.g. rifle = elongated box + cylinder).
3. Smart UV Project → scale to fill 0–1.
4. Shader: Image Texture (your Leonardo crop or painted bake) → Principled BSDF.
5. Export glTF if replacing cylinders in Phase E; for current POC export **WebP only** to `assets/textures/{path}`.

## Mobile optimization

- Prefer **one texture per prop**; atlas only for UI/icons.
- Disable normal maps on phone tier (future LOD flag in manifest).
- Use WebP quality 80–85 for environments.

## Verification

After dropping textures, open DevTools → Network: confirm `assets/textures/...webp` returns 200. Missing files silently fall back to procedural meshes in `world3d.js`.
