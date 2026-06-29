# Game assets — Leonardo → Blender → Web POC

Drop Leonardo.ai exports here using the filenames in `manifest.json`. The game loads textures from `textures/` and falls back to procedural geometry when a file is missing.

**Leonardo export folder:** Raw JPG/PNG outputs live in `images/leonardo export/`. Paths are mapped in [`leonardo-export-map.json`](leonardo-export-map.json). After updating images there, bump `version` in that file so browsers reload textures.

## Quick start

1. Export each Leonardo image as **WebP** or **PNG** (WebP preferred for mobile) — **or** place JPGs in `images/leonardo export/` per the export map.
2. Save baked assets to the path listed in `manifest.json` → `path` (under `textures/`), **or** update `leonardo-export-map.json` to point at your export filenames.
3. Bump `version` in `leonardo-export-map.json` when exports change.
4. Reload the game — mission landmarks, briefings, and Freedom Grid pick up textures automatically.

## Folder layout

```
assets/
  manifest.json          ← master catalog (IDs, missions, prompts)
  textures/
    weapons/             ← prop sheets: rifles, rods, tools
    props/               ← newspapers, curfew posters, ledgers
    environments/        ← facades, checkpoints, market squares
    vehicles/            ← Bedford trucks, Austin sedans, mammy trucks
    characters/          ← civilian sheets, veteran marchers
  concepts/              ← optional: raw Leonardo outputs before Blender bake
  models/                ← future GLB exports from Blender (Phase E)
```

## Naming convention

`{id}.webp` where `id` matches `manifest.json` (e.g. `lee-enfield-no4.webp`).

## Blender pipeline (data-lite)

See [`docs/production/blender-texture-pipeline.md`](../docs/production/blender-texture-pipeline.md).

**Rule of thumb:** Leonardo detail on a **low-poly mesh** + **one diffuse map** (~512–1024px) per prop; normal maps only for hero assets (Crossroads checkpoint, Secretariat facade).

## Faction contrast

| Faction | Visual read |
|---------|-------------|
| **British colonial** | Olive drab, blued steel, white stucco, barbed wire, polished black sedans |
| **Ghanaian resistance** | Laterite dust, wax print, hand-forged iron, wooden stalls, weathered mammy trucks |
