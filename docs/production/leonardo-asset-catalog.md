# Leonardo.ai asset catalog — 1948 colonial Accra

**Status:** Images generated via Leonardo.ai Pro → import per [`assets/README.md`](../../assets/README.md)  
**Canon:** [`STORYLINE.md`](../../STORYLINE.md)  
**Game binding:** [`assets/manifest.json`](../../assets/manifest.json) + [`src/accra-freedom-grid.json`](../../src/accra-freedom-grid.json)

This catalog defines the **visual contrast** between well-equipped British colonial machinery and resourceful, culturally grounded Ghanaian resistance. Assets are **data-lite**: Leonardo detail baked onto low-poly meshes or billboards in Blender.

---

## Faction visual language

| British colonial | Ghanaian resistance |
|------------------|-------------------|
| Olive drab, blued steel, white stucco | Laterite red dirt, wax print, hand-forged iron |
| Barbed wire, sandbags, Crown broadsides | Wooden stalls, woven baskets, mammy trucks |
| Bedford OY troop carriers, Austin sedans | Yaw's workshop, hooked rods, dane guns |
| Lee-Enfield, Sten, Webley | Newspapers, ledgers, petitions (truth as weapon) |

---

## 1. Firearms, ammunition, and local tools

### British colonial arsenal

| Asset ID | Weapon | Game role | Leonardo prompt |
|----------|--------|-----------|-----------------|
| `lee-enfield-no4` | Lee-Enfield No. 4 Mk I | Constable rifle; slow accurate fire | 3D asset prop sheet, Lee-Enfield No. 4 rifle, 1940s British military bolt-action rifle, weathered wood stock, dark iron barrel, multiple angles side view, photorealistic textures, optimized for game engine asset baking, flat gray studio background --tile false |
| `sten-mk2` | Sten Mk II | Officer tactical squads | 3D asset prop sheet, Sten Mk II submachine gun, 1940s British military firearm, side-loading magazine, skeleton metal stock, crude industrial design, multiple angles, realistic gun metal texture, video game asset style, flat gray studio background --tile false |
| `webley-mk4` | Webley Mk IV | Imray / inspector sidearm | 3D asset prop sheet, Webley Mk IV top-break revolver, vintage service pistol, dark blued steel finish, checkered grip, multiple angles, photorealistic weapon asset, flat gray studio background --tile false |

### Resistance improvised arsenal

| Asset ID | Weapon | Game role | Leonardo prompt |
|----------|--------|-----------|-----------------|
| `hooked-iron-rod` | Hooked iron rod | Araba signature melee | 3D asset prop sheet, heavy custom-forged steel tire iron with a rustic hooked handle, scratched and dented metal, dark industrial finish, 1940s resistance tool, weapon asset, flat gray background |
| `dane-gun` | Dane gun | Kaneshie rural recruits | 3D asset prop sheet, West African flintlock dane gun, elongated rusted iron barrel, hand-carved dark wooden stock, vintage mechanisms, authentic historical design, game weapon asset, flat gray background |
| `yaw-toolkit` | Sabotage toolkit | Yaw hub; wirecutters, powder | 3D asset prop sheet, collection of 1940s mechanical tools, vintage iron wirecutters, rusted oil cans, crude canvas tool wrap, weathered textures, game engine prop design, flat gray background |

---

## 2. Documents, propaganda, and media

| Asset ID | Item | Game role | Leonardo prompt |
|----------|------|-----------|-----------------|
| `accra-evening-news` | Accra Evening News | Intel UI; anti-colonial headlines | High-resolution flat lay of a vintage 1948 West African newspaper, yellowed weathered newsprint, bold black headlines reading anti-colonial resistance statements, historic typography, realistic paper texture, game asset prop |
| `curfew-broadside` | Curfew broadside | Wall decal in British sectors | Graphic design asset, vintage 1948 British colonial government official notice, bold text reading "CURFEW IN FORCE BY ORDER OF THE GOVERNOR", official red crown stamp, weathered paper texture, distressed edges, game world decall asset |

---

## 3. Settings, architecture, and buildings

### British sectors (Victoriaborg and Osu)

| Asset ID | Location | Missions | Leonardo prompt |
|----------|----------|----------|-----------------|
| `crossroads-checkpoint` | Christiansborg Crossroads | M10 | Cinematic environment concept art, 1948 Christiansborg Crossroads in Accra Ghana, white wooden military guard shack, sandbag fortifications, coils of vintage barbed wire, dusty laterite red dirt road leading towards a distant coastal colonial castle, dramatic lighting |
| `colonial-secretariat` | Colonial Secretariat | M14 | 3D environment concept art, British colonial administration building facade, 1940s classic architecture, white stucco walls, long arched open verandas, dark green wooden window shutters, clean manicured lawn, architectural gaming environment |

### Resistance sectors (Ussher Town, James Town, markets)

| Asset ID | Location | Missions | Leonardo prompt |
|----------|----------|----------|-----------------|
| `salaga-market` | Salaga Market Square | M11, M12 | Cinematic environment concept art, historic Salaga Market in Accra 1948, packed wooden market stalls, clusters of woven baskets, bundles of textiles, narrow red dirt alleys, vibrant tropical sunlight cutting through canvas awnings, tactical game level layout |
| `ussher-workshop` | Yaw's garage | M15 hub | Interior environment concept art, hidden mechanical workshop in 1940s Accra, stone walls, hanging iron tools, grease-stained workbenches, shafts of light filtering through dusty wooden roof beams, atmospheric tactical game hideout |
| `awam-store-front` | AWAM store | M12 | Shuttered boycott target — valid demolition objective |
| `kaneshie-warehouse` | Kaneshie warehouse | M13 | First riot fires backdrop |

---

## 4. Vehicles and transportation

| Asset ID | Vehicle | Faction | Leonardo prompt |
|----------|---------|---------|-----------------|
| `bedford-oy-truck` | Bedford OY troop carrier | British | 3D vehicle asset sheet, 1940s Bedford OY military truck, dark olive-drab paint, weathered canvas truck bed cover, iron wheels, multiple view angles, photorealistic low-poly vehicle asset, flat gray background |
| `austin-police-car` | Austin 10 police sedan | British | 3D vehicle asset sheet, vintage 1940s black Austin 10 sedan, glossy but dusty finish, chrome bumpers, right-hand drive, game-ready model asset sheet, multiple angles, flat gray studio background |
| `mammy-truck` | Mammy truck (Bedford TJ) | Resistance | 3D vehicle asset sheet, historic West African mammy truck, 1940s customized Bedford truck with an open wooden passenger chassis, hand-painted colorful local slogans on the wooden boards, heavily weathered, game asset model |

---

## 5. Civilian fashion and outfits

| Asset ID | Character | Game role | Leonardo prompt |
|----------|-----------|-----------|-----------------|
| `market-woman` | Market woman | Boycott crowds; M12 stall protection | 3D character concept sheet, 1948 Ghanaian market woman civilian, traditional patterned wax print cloth wrapped around the body, matching headtie, leather sandals, neutral pose, game engine character asset, flat gray background |
| `veteran-marcher` | Ex-serviceman | M8–M10 unarmed column | 3D character concept sheet, 1940s West African World War II veteran, faded khaki Gold Coast Regiment uniform shirt, shorts, dark woolen puttees wrapped around calves, holding a rolled white paper petition document, solemn expression, game asset sheet |

**Canon lock:** Veteran marchers hold **petitions only** — no weapons at Crossroads.

---

## 6. The Accra Freedom Grid

Coastal axis: **West (local hubs)** → **East (colonial citadels)**. Data: [`src/accra-freedom-grid.json`](../../src/accra-freedom-grid.json).

| Sector | Side | Zone | Missions |
|--------|------|------|----------|
| **1** | West | James Town & Ussher Town (The Slums) | M4, M11, M15 — Yaw's hub |
| **2** | West | Salaga & Makola Markets | M1, M2, M6, M12, M13 |
| **3** | East | Victoriaborg (Administrative) | M3, M5, M7, M14 |
| **4** | East | Christiansborg Crossroads | M8, M9, M10 — sacred beat |
| **Stronghold** | East | Osu Castle (The Seat) | Epilogue after M10 |

**Routes:** Winneba/Rowe Road (Sector 1 ↔ 3) · The March Route (Sector 2 → 4)

---

## Import checklist (after Leonardo generation)

1. Export WebP at sizes in `manifest.json` → `recommendedSize`.
2. Save to `assets/textures/{path}` matching each asset ID filename.
3. Optional: Blender bake to low-poly GLB in `assets/models/` for Phase E port.
4. Run game — missing files keep procedural placeholders; loaded files appear as 3D billboards.

See [`blender-texture-pipeline.md`](blender-texture-pipeline.md) for mesh workflow.
