# LODESTAR_FREEDOM AND JUSTICE — Production Roadmap

**Last updated:** June 2026  
**Current build:** Web POC (`npm start` → localhost:9097)  
**Canon lock:** [`STORYLINE.md`](STORYLINE.md) — read before any narrative change  
**Story planning:** [`storyboard planner.md`](storyboard%20planner.md)

---

## Progress legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🟨 | In progress / placeholder |
| 🟩 | POC complete (playable prototype) |
| 🟦 | Production quality (ship-ready) |

**Overall project:** `████████░░░░░░░░░░░░` **38%** (POC phase)

---

## Master timeline

```
PHASE A — Foundation (NOW)     Canon, mechanics, web POC, roadmap
PHASE B — Content              Prologue, dialogue, missions polish
PHASE C — Production art       Leonardo → Blender → textures → 3D
PHASE D — Audio                SFX library, ElevenLabs voice, spatial mix
PHASE E — Engine port          Unity URP or Godot 4 (mobile + desktop)
PHASE F — Ship                 Store builds, QA, launch, Phase IV DLC
```

---

## Category status board

| Category | Status | % | Next milestone |
|----------|--------|---|----------------|
| [Strict storyline](#1-strict-storyline-guardrails) | 🟩 POC | 75% | Prologue + conversation bible |
| [Storyline & narrative](#2-storyline--narrative) | 🟩 POC | 70% | Write prologue narration |
| [Conversations](#3-conversations--dialogue) | 🟨 | 25% | Mission briefings → dialogue scenes |
| [Characters](#4-characters) | 🟨 | 30% | Orthographic sheets (Leonardo) |
| [Map & world](#5-map--world) | 🟨 | 45% | Accra Freedom Grid + Leonardo texture drop-in |
| [3D render](#6-3d-render) | 🟨 | 45% | Billboards from manifest; cylinders until GLB |
| [Images & UI art](#7-images--ui-art) | 🟨 | 25% | Leonardo catalog + manifest wired |
| [Sound (SFX)](#8-sound-sfx) | 🟨 | 15% | Real gun/footstep/ambient library |
| [Voice overs](#9-voice-overs) | ⬜ | 0% | Nkrumah briefing pilot (ElevenLabs STS) |
| [Ship & deploy](#10-ship--deploy) | 🟨 | 20% | PWA + touch QA on real devices |

---

## 1. Strict storyline guardrails

> **Purpose:** Keep the game historically grounded and tonally consistent while leaving room for tactical gameplay, recruitment, and squad action *around* fixed events — never *replacing* them.

### Non-negotiable locks (never break without updating `STORYLINE.md`)

| Rule | Locked fact | Creative room allowed |
|------|-------------|------------------------|
| **Date** | Christiansborg shooting = **28 February 1948** | Missions 1–9 happen in late 1947 – Feb 1948 |
| **Martyrs** | **Adjetey, Attipoe, Lamptey** die at Crossroads | Wound Attipoe earlier (M6); save *other* marchers at M10 |
| **Governor** | **Gerald Creasy** refuses petition | Radio chatter, intel docs, NPC references |
| **Superintendent** | **Colin Imray** commands constables at gate | Enemy AI, witness dialogue, cinematic beat |
| **Nkrumah** | Briefings only; urges **peaceful** protest | New radio lines, recruitment speeches — no assassination orders |
| **Asare** | Double agent; always loyal to Gold Coast | Trust meter ambiguity; new side missions |
| **Tone** | Dignity, debt owed, truth as weapon | Action = defense & extraction, not revenge fantasy |
| **Win state** | Evidence out, witnesses saved, momentum gained | **Not** British military defeat or martyrs surviving canon ending |

### Allowed creative expansion (safe zones)

- **Recruitment:** Rally veterans between M1–M7 (meter = independence momentum).
- **Squad action:** Follow / Defend / Attack orders; flanking, hold zones, escorts.
- **Stealth & intel:** Ledgers, pamphlets, witness nodes, demolition — all truth-gathering.
- **Colonial antagonists:** Checkpoints, couriers, patrols — institutional, not caricature.
- **Phase IV (future):** Five-Day Accra Riots — district liberation *after* Crossroads.

### Drift checklist (run before every content PR)

- [ ] Does this contradict a date or name in `historicalFigures` (missions.json)?
- [ ] Does the player "win" by preventing the three deaths?
- [ ] Is Nkrumah ordering violence?
- [ ] Are civilians armed as combatants?
- [ ] Is Asare revealed as a true traitor (he is not)?
- [ ] Does new text use 1963/64 or wrong veteran names?

**Status:** 🟩 Guardrails documented in `STORYLINE.md` + `missions.json`  
**Gap:** Prologue not written; no `conversations.json` schema yet

---

## 2. Storyline & narrative

| Item | Status | Notes |
|------|--------|-------|
| Campaign premise | 🟩 | Ex-servicemen, peaceful petition, dignity |
| 10-mission spine (M1–M10) | 🟩 | `missions.json` — objectives, intel, Asare arc |
| 4 campaign phases defined | 🟩 | Mobilization → March → Crossroads → Riots (future) |
| Character bible | 🟩 | `STORYLINE.md` §3 — Adjetey, Attipoe, Lamptey, Asare, Nkrumah |
| Asare trust arc (10 events) | 🟩 | Scripted deltas M1–M10 |
| Historical figures in data | 🟩 | Imray, Creasy, Bonne III in `missions.json` |
| **Prologue** (state of affairs) | ⬜ | *See storyboard planner.md* |
| Mission epilogues / connective tissue | 🟨 | M10 epilogue done; M1–M9 light |
| Phase IV riot campaign (M11+) | ⬜ | Outlined only |
| Watson Commission / 1957 epilogue | ⬜ | Text-only end card |

### Storyline task list

- [ ] Write **prologue narration** (WWII promises → withheld benefits → boycott → march planned)
- [ ] Add `prologue.json` or first-run cinematic flag in campaign save
- [ ] Review each mission `briefing` / `victoryText` for voice consistency
- [ ] Draft Phase IV mission stubs (3–5 riots-era levels)

---

## 3. Conversations & dialogue

| Item | Status | Notes |
|------|--------|-------|
| Mission briefing overlays | 🟩 | Title + subtitle + historical note |
| Intel pickup popups | 🟩 | `missions.json` intel items |
| Witness account nodes | 🟩 | M7, M10 press E |
| Asare event messages | 🟩 | Trust-triggered overlays |
| **In-mission barks** (combat) | ⬜ | "Contact!" "Reloading!" etc. |
| **Squad chatter** | ⬜ | Adjetey / Attipoe / Lamptey lines |
| **Nkrumah radio briefings** | 🟨 | Text only; needs VO |
| **NPC conversations** (branching) | ⬜ | Recruitment, safehouse, market |
| **Prologue narrator** | ⬜ | Planned in storyboard planner |
| Conversation data file | ⬜ | Proposed: `src/conversations.json` |

### Proposed `conversations.json` structure

```json
{
  "prologue": { "id": "prologue", "lines": [{ "speaker": "Narrator", "text": "..." }] },
  "missions": {
    "1": { "start": [], "mid": [], "end": [] }
  },
  "barks": { "player_hit": [], "squad_order": [], "enemy_spot": [] }
}
```

### Conversation task list

- [ ] Create `src/conversations.json` schema
- [ ] Write prologue (8–12 lines, narrator voice)
- [ ] 3–5 barks per squad member
- [ ] Colonial radio intercept lines (M3, M6)
- [ ] M10 witness dialogue polish (Imray, Creasy referenced by witnesses only)

---

## 4. Characters

| Item | Status | Notes |
|------|--------|-------|
| Playable squad roster | 🟩 | `squad.js` — Adjetey, Attipoe, Lamptey stats |
| Player avatar | 🟩 | Adjetey (leader) |
| Asare NPC pathing | 🟩 | M7 tail mission |
| Escorts / VIPs | 🟩 | M2, M8, M9 columns |
| Enemy types (courier, guard) | 🟩 | Matter.js circles / 3D cylinders |
| **3D character models** | ⬜ | Cylinder placeholders only |
| **Leonardo concept sheets** | ⬜ | Khaki uniform, 1940s Gold Coast Regiment |
| **Blender rig + animation** | ⬜ | Idle, walk, shoot, death |
| Imray / Creasy (cinematic only?) | ⬜ | Silhouette or portrait at M10 |
| Nii Kwabena Bonne III (NPC/ref) | ⬜ | M2 market scene |
| **Phase IV squad (Kojo, Araba, Kofi, Kwesi + Yaw mentor)** | 🟩 | [`docs/characters/phase-iv-squad.md`](docs/characters/phase-iv-squad.md) |
| **Kofi Fast Learner growth** | 🟨 | `phase-iv-squad.js` — not in gameplay yet |
| **Kwesi non-combat + rescue loop** | 🟨 | `kwesi-mechanics.js` |
| **Kojo command + Riot Rally bailout** | 🟨 | `kojo-mechanics.js` |

### Character art pipeline

```
Leonardo orthographic sheet → Blender model → Rigify → Export GLB
→ Replace cylinder in view3d.js → Unity/Godot prefab (Phase E)
```

### Character task list

- [ ] Leonardo prompts for 3 squad members (front/side sheet)
- [ ] Colonial constable generic model
- [ ] Civilian / organizer model (unarmed)
- [ ] Name labels above units (optional HUD)

---

## 5. Map & world

| Item | Status | Notes |
|------|--------|-------|
| Abstract mission layouts | 🟩 | `obstacles`, `checkpoints`, zones in JSON |
| Procedural 3D terrain | 🟩 | `world3d.js` — hills, trees, crates |
| 3D structures (walls/buildings) | 🟩 | Obstacle → `createStructure()` |
| Extraction / hold zones | 🟩 | Beacons, hold radius |
| **Real Accra geography** | ⬜ | Kingsway, Makola, Christ Church, Crossroads |
| **Mission-specific landmarks** | 🟩 POC | M10–M15 procedural + Leonardo billboards |
| **Accra Freedom Grid** | 🟩 | `src/accra-freedom-grid.json` + mission menu UI |
| **Leonardo texture drop-in** | 🟨 | `assets/manifest.json` — drop WebP to activate |
| Minimap | ⬜ | — |
| Phase IV district map (riots) | 🟩 | Grid nodes M11–M15 linked |

### Map zones to build (historical)

| Mission | Real-world anchor | Map art status |
|---------|-------------------|----------------|
| M1 | Old Kingsway Depot | ⬜ Generic depot |
| M2 | Kaneshie Market | ⬜ Generic market |
| M3 | Radio Hill | ⬜ |
| M4 | James Town checkpoint | ⬜ |
| M5 | Castle courier route | ⬜ |
| M6 | Makola | ⬜ |
| M7 | Castle approach | ⬜ |
| M8 | Christ Church | ⬜ |
| M9 | Coast road to Castle | ⬜ |
| M10 | **Christiansborg Crossroads** | ⬜ Priority landmark |

---

## 6. 3D render

| Item | Status | Notes |
|------|--------|-------|
| Three.js renderer | 🟩 | `view3d.js` |
| Terrain heightmap | 🟩 | `world3d.js` |
| Cylindrical unit proxies | 🟩 | Player, squad, enemies |
| Shadows & fog | 🟩 | Directional light, exp fog |
| Bullets / zones / intel markers | 🟩 | 3D markers |
| Camera (isometric) | 🟩 | Perspective, full-map view |
| **PBR materials / textures** | ⬜ | Flat vertex colors |
| **Character GLB import** | ⬜ | — |
| **Muzzle flash / particles** | ⬜ | — |
| **M10 cinematic camera** | ⬜ | Scripted Crossroads beat |
| Unity URP / Godot port | ⬜ | Phase E |

### 3D performance targets (ship)

| Platform | Target FPS | Budget |
|----------|------------|--------|
| Laptop | 60 | Full shadows, medium draw distance |
| Tablet | 30–60 | Reduced shadow map, texture atlas |
| Phone | 30 | Baked lighting, pooled VFX, LOD |

---

## 7. Images & UI art

| Item | Status | Notes |
|------|--------|-------|
| HTML/CSS UI (menus, overlays) | 🟩 | Mission select, briefing box |
| 360° center joystick UI | 🟩 | Compass + degree readout |
| **Title / key art** | ⬜ | — |
| **Mission loading cards** | ⬜ | Leonardo scene stills |
| **Character portraits** | ⬜ | Briefing sidebar |
| **Intel document props** | 🟨 | `accra-evening-news`, `curfew-broadside` in manifest |
| **Leonardo production catalog** | 🟩 | [`docs/production/leonardo-asset-catalog.md`](docs/production/leonardo-asset-catalog.md) |
| **Asset manifest (18 props)** | 🟩 | [`assets/manifest.json`](assets/manifest.json) |
| **Wanted poster (Asare M8)** | ⬜ | Referenced in text only |
| **Commendation medal icons** | ⬜ | Text-only commendations |
| App icon (PWA / stores) | ⬜ | — |

---

## 8. Sound (SFX)

| Item | Status | Notes |
|------|--------|-------|
| Procedural bleeps (ZzFX) | 🟩 | `audio.js` — shoot, hit, intel, order, etc. |
| **Gunfire (period-appropriate)** | ⬜ | Lee–Enfield / colonial arms research |
| **Footsteps** (dirt / concrete / church) | ⬜ | FMOD footprinting later |
| **Ambient Accra** (market, crowd, coast) | ⬜ | — |
| **UI sounds** | ⬜ | Menu, briefing open/close |
| **Crowd / march ambience** | ⬜ | M8–M9 |
| **Tribute / solemn sting** | 🟨 | `sfxTribute()` placeholder |
| Spatial 3D audio | ⬜ | FMOD/Wwise in engine port |

---

## 9. Voice overs

| Item | Status | Notes |
|------|--------|-------|
| All dialogue | ⬜ | Text-only in overlays |
| **Nkrumah briefings** | ⬜ | ElevenLabs STS — record performance first |
| **Narrator (prologue)** | ⬜ | Ghanaian English; measured, documentary tone |
| **Squad VO** | ⬜ | Adjetey, Attipoe, Lamptey barks |
| **Asare** | ⬜ | Bilingual clerk; calm under pressure |
| **Colonial radio** | ⬜ | British colonial officer; M3, M6 |
| **Witness accounts** | ⬜ | M10 — civilian voices |
| Twi / Ga / Pidgin lines (optional) | ⬜ | Subtitled; authenticity pass |

### VO production order

1. Prologue narrator (sets tone)  
2. Nkrumah M1 + M10 briefing  
3. M10 witness lines  
4. Squad combat barks  
5. Asare reveal (M7, M10 radio)

---

## 10. Ship & deploy

| Item | Status | Notes |
|------|--------|-------|
| Local dev server | 🟩 | `npm start` port 9097 |
| Web playable POC | 🟩 | Browser — laptop tested |
| Cross-platform input | 🟩 | `input.js` + joystick + keyboard |
| Bullet object pooling | 🟩 | 48-body pool |
| **PWA manifest** | ⬜ | Install on phone/tablet |
| **Mobile browser QA** | 🟨 | Touch UI exists; needs device pass |
| **Performance profiling** | ⬜ | Low-end Android target |
| **Unity/Godot builds** | ⬜ | Phase E |
| iOS / Android store | ⬜ | Phase F |
| itch.io / web demo | ⬜ | Optional early access |
| Analytics / crash reporting | ⬜ | — |

### Ship milestones

| Milestone | Target | Criteria |
|-----------|--------|----------|
| **Alpha** | Phase B complete | Prologue + all M1–M10 playable with text dialogue |
| **Beta** | Phase C+D | 3D assets + VO for M1, M8, M10 |
| **RC** | Phase E | Unity/Godot mobile build 30 FPS |
| **1.0** | Phase F | Store submission + historical advisory note |

---

## Recommended build order (next 12 weeks)

| Week | Focus | Categories |
|------|-------|------------|
| 1–2 | Prologue + `conversations.json` + dialogue pass M1–M3 | Storyline, Conversations |
| 3–4 | Leonardo character sheets + Crossroads map blockout | Characters, Map, Images |
| 5–6 | Blender squad models → GLB in web viewer | 3D render, Characters |
| 7 | SFX pack + Nkrumah VO pilot | Sound, Voice |
| 8–9 | M8–M10 narrative polish + M10 cinematic | Storyline, Conversations, 3D |
| 10 | PWA + mobile QA | Ship |
| 11–12 | Unity URP scaffold + import missions.json | Ship, 3D |

---

## File index (what exists today)

| File | Role |
|------|------|
| `STORYLINE.md` | Canon — **do not drift** |
| `ROADMAP.md` | This file — production status |
| `storyboard planner.md` | Prologue & conversation scratchpad |
| `src/missions.json` | 10 missions + phases + historical figures |
| `src/conversations.json` | Phase IV origin scenes + future dialogue |
| `docs/narrative/phase-iv-band-together.md` | How the cell bands together (readable) |
| `src/game.js` | Core loop, campaign, HUD |
| `src/squad.js` | Squad AI + roster |
| `src/view3d.js` / `world3d.js` | 3D presentation |
| `src/input.js` | Cross-platform input |
| `src/youth-squad.json` | Phase IV roster (Kojo, Araba, Kofi, Kwesi + Yaw mentor) |
| `src/phase-iv-squad.js` | Kofi growth curve, command helpers |
| `src/kwesi-mechanics.js` | Kwesi non-combat abilities |
| `src/kojo-mechanics.js` | Kojo squad orders & combat |
| `docs/characters/phase-iv-squad.md` | Squad command structure & stats |
| `src/audio.js` | Placeholder SFX |

---

## Quick reference: what "done" looks like for 1.0

- [ ] Player feels the arc: **debt → organize → march → witness → sacrifice → momentum**
- [ ] Every mission respects `STORYLINE.md` locks
- [ ] Prologue plays on first launch
- [ ] 3D Accra reads as 1948, not generic hills
- [ ] Voices ground the history (at minimum: narrator + Nkrumah + M10)
- [ ] Runs on phone, tablet, and laptop
- [ ] Christiansborg Crossroads lands with weight — names spoken, not forgotten

*The martyrs' names are the title screen we never skip.*
