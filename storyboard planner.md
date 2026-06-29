# Storyboard Planner

> **Canon:** [`STORYLINE.md`](STORYLINE.md)  
> **Full roadmap:** [`ROADMAP.md`](ROADMAP.md)  
> **Mission data:** [`src/missions.json`](src/missions.json)  
> **Mission targets M1–M12:** [`docs/narrative/mission-targets-m1-m12.md`](docs/narrative/mission-targets-m1-m12.md)

Use this file to draft scenes, conversations, and the prologue before moving text into `src/conversations.json` or `missions.json`.

---

## Prologue — "The Debt" (IN GAME 🟩)

**When:** First launch / New Campaign  
**Voice:** Narrator (documentary tone — Ghanaian English)  
**Length target:** 60–90 seconds (~12 lines)  
**Data:** `src/conversations.json` → `prologue` · Save flag `prologueSeen` in `campaign.js`

### State of affairs (draft beats)

1. **WWII** — Gold Coast men served Britain. Promises made in the King's name.
2. **Demobilization** — Veterans return home. Benefits delayed, denied, buried in colonial ledgers.
3. **1947 Accra** — Ex-servicemen's Union grows. UGCC organizers meet in markets and churches.
4. **Boycott** — Nii Kwabena Bonne III's movement. Shops close. The colony feels the pressure.
5. **Nkrumah's line** — Peaceful petition, not rebellion. Ink before iron.
6. **The march planned** — 28 February 1948. Christiansborg Castle. Two thousand unarmed veterans.
7. **Hand to player** — *You are Sergeant Adjetey. Your squad owes the Crown nothing — the Crown owes you everything.*

### Prologue conversation draft

| # | Speaker | Line (draft) |
|---|---------|--------------|
| 1 | Narrator | They sent us to Burma, to Italy, to die for a King we never met. |
| 2 | Narrator | When we came home, the Treasury said the debt was settled. The ledgers said otherwise. |
| 3 | Narrator | In Accra, in '47, we stopped asking politely. |
| 4 | Narrator | Dr. Nkrumah spoke of self-government — not with rifles, but with signatures and witnesses. |
| 5 | Narrator | On the twenty-eighth of February, we would march to Christiansborg unarmed. |
| 6 | Narrator | A petition. A promise kept by the people, if not by the Governor. |
| 7 | Narrator | Sergeant Adjetey — you, Attipoe, Lamptey — you do not start a war today. |
| 8 | Narrator | You gather truth. You protect the march. You make sure the world is watching. |

*Edit freely — but do not change the date, the peaceful intent, or the martyrs' fate.*

---

## Conversations to add (checklist)

### By mission

| Mission | Scene | Status | Notes |
|---------|-------|--------|-------|
| M1 | Asare opens Kingsway gate | 🟩 | `triggers.asareStart` + proximity |
| M1 | Ledger intel popups | 🟩 | 3 intel items |
| M2 | Market escort — organizer thanks | 🟩 | `triggers.onExtraction` |
| M3 | Lamptey arms charges — squad banter | 🟩 | `start` + `onFirstDemolition` |
| M6 | Ambush — colonial radio intercept | 🟩 | `triggers.ambush` + `mid` |
| M7 | Witness Asare handoff | 🟩 | `triggers.witness` |
| M8 | Petition read aloud (crowd) | 🟩 | `triggers.intel.Petition Read` |
| M9 | Column chant / Nkrumah radio | 🟩 | `triggers.radio` + `onWaypoint` |
| M10 | Witness nodes ×3 | 🟩 | Imray / Creasy referenced |
| M10 | Tribute cinematic | 🟩 | Overlay in `game.js` |
| M1–M12 | Start / mid / victory / triggers | 🟩 | [`mission-targets-m1-m12.md`](docs/narrative/mission-targets-m1-m12.md) + `conversations.json` |
| M1–M15 | Start / mid / victory dialogue | 🟩 | `conversations.json` → `missions` |
| M15 / campaign | Watson Commission / 1957 epilogue | 🟩 | `epilogue` block |
| Squad barks (veteran + Phase IV) | 🟩 | `barks` + combat triggers |

### Squad barks (combat — 🟩)

- **Adjetey:** Orders, cover calls, protect civilians — `adjetey_contact`, `adjetey_cover`, `adjetey_orders`, `adjetey_low_hp`, `adjetey_extraction_rush`, `adjetey_hold_pressure`
- **Attipoe:** Contact reports, route clear — `attipoe_clear`, `attipoe_contact`, `attipoe_escort`, `attipoe_escort_endangered`, `attipoe_low_hp`
- **Lamptey:** Demolition ready, intel found — `lamptey_charges`, `lamptey_demolition`, `lamptey_intel`, `lamptey_under_fire`
- **Phase IV:** `kojo_low_hp`, `kojo_extraction_rush`, `araba_hold_pressure`, `kwesi_spotted`, `kofi_under_fire`
- **Tension one-liners:** `tensionBarks` → ambush, extraction, handoff, holdZone (wired in `game.js`)

### Narrative pacing (🟩)

| Beat | Status | Data / trigger |
|------|--------|----------------|
| Character backstories (10 keys) | 🟩 | `conversations.json` → `characterBackstories` |
| First-mission backstory unlock | 🟩 | M1 Adjetey, M2 Attipoe, M3 Lamptey, M5 Asare, M8 Nkrumah, M11–14 Phase IV |
| Yaw hub snippet (first visit) | 🟩 | `getYawHubBackstorySnippet` + `backstoriesSeen` in save |
| Mission `mid` tension lines | 🟩 | M1–M11 enriched — risk, deadlines, canon locks |
| Combat barks under fire | 🟩 | `firstContact`, low HP ≤30%, extraction proximity, VIP hurt, hold zone 50% |
| Sharp pause dialogue | 🟩 | Ambush/extraction/handoff → overlay + `tensionBarks` bark |

## Phase IV squad — command structure

| Tier | Character | Role |
|------|-----------|------|
| Mentor | **Yaw** | Hub only — upgrades, briefings |
| **1st** | **Kojo** | Cell leader — tactics, squad orders |
| **2nd** | **Araba** | Enforcer — Riot Rally bailout |
| Squad | **Kofi** | Rookie → Fast Learner |
| Support | **Kwesi** | Non-combat clerk |

Full spec: [`docs/characters/phase-iv-squad.md`](docs/characters/phase-iv-squad.md)

### Phase IV — How they band together 🟩

Full dialogue: [`src/conversations.json`](src/conversations.json) · Summary: [`docs/narrative/phase-iv-band-together.md`](docs/narrative/phase-iv-band-together.md)

| Order | Scene | Who joins |
|-------|-------|-----------|
| 1 | Crossroads dusk | **Kojo** — witnesses martyrdom, chooses a plan |
| 2 | Salaga Market night | **Araba** — wounded cousin, pact with Kojo |
| 3 | Kaneshie dawn riots | **Kofi** — rescued from constables |
| 4 | Ussher yard night | **Yaw** — mentor hub, grandfather's story |
| 5 | Victoriaborg midnight | **Kwesi** — stolen manifests, truth condition |
| 6 | Pre-dawn oath | **Cell formed** — Kojo 1st, Araba 2nd |

### Phase IV conversation beats (remaining)

- [x] Origin scenes — band together (6 scenes)
- [x] Kojo first squad order in mission (Tab — hold / suppress / flank)
- [x] Araba Riot Rally when Kojo trapped (auto switch + smoke)
- [x] Kofi first shot / late-game confidence (first-shot bark)
- [x] Nkrumah radio: discipline amid riots (M9)

### Recruitment (creative room)

Market women, boycott runners, and motor-yard boys join the **cause** — not the player's fireteam as armed units.

---

## Strict storyline reminders (while writing)

- ✅ Action, recruitment, stealth, squad tactics — **yes**
- ✅ Fictional missions *around* real events — **yes**
- ❌ Martyrs survive Crossroads — **no**
- ❌ Nkrumah orders assassinations — **no**
- ❌ Armed civilian mobs as player units — **no**
- ❌ Wrong dates (1963/64) or wrong names — **no**

---

## Next actions

1. [x] Finalize prologue draft → `src/conversations.json`
2. [x] Hook prologue into `campaign.js` first-run flag
3. [x] Write M2 safehouse conversation
4. [x] Write M9 column radio from Nkrumah
5. [x] Complete all mission conversations M1–M15 + epilogue
6. [ ] Record narrator lines for ElevenLabs STS pilot
