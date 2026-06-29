# Game assets — Leonardo → Blender → Web POC

Drop Leonardo.ai exports here using the filenames in `manifest.json`. The game loads textures from `textures/` and falls back to procedural geometry when a file is missing.

## Quick start

1. Export each Leonardo image as **WebP** or **PNG** (WebP preferred for mobile).
2. Save to the path listed in `manifest.json` → `path` (under `textures/`).
3. Reload the game — mission landmarks and props pick up textures automatically.

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
