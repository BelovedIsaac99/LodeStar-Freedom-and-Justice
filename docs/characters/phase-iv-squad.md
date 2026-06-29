# Phase IV Squad — Command Structure & Profiles

**Campaign:** Five-Day Accra Riots (1–5 March 1948)  
**Data:** [`src/youth-squad.json`](../../src/youth-squad.json)

---

## Command hierarchy

| Tier | Character | Role |
|------|-----------|------|
| **Mentor (hub only)** | **Yaw** | Base commander — upgrades, briefings, no frontline |
| **1st in Command** | **Kojo** | Cell leader — tactics, flanks, squad orders |
| **2nd in Command** | **Araba** | Enforcer — heavy assault, Riot Rally bailout |
| **Squad** | **Kofi** | Rookie → Fast Learner growth arc |
| **Support** | **Kwesi** | Non-combat clerk — intel only |

---

## Attribute matrix

| Character | Tier | Power | Agility | Durability | Intel | Stealth | Combat |
|-----------|------|-------|---------|------------|-------|---------|--------|
| **Kojo** | 1st | 65 | **95** | 70 | **85** | **90** | Leader / flanker |
| **Araba** | 2nd | **95** | 50 | **90** | 30 | 20 | Heavy melee |
| **Kofi (early)** | Member | 40 | 50 | 45 | 35 | 40 | Clumsy / high recoil |
| **Kofi (late)** | Member | **85** | **85** | **80** | **75** | **75** | Elite hybrid |
| **Kwesi** | Support | 15 | 70 | 40 | **95** | **95** | **Non-combat** |

---

## Mission loop

```
Yaw (hub) ──► briefs, upgrades, honors grandfather's sacrifice
     │
     ▼
Kwesi ──► wiretap / vault intel
     │
     ▼
Kojo ──► plan + squad orders + flank
     │
     ├─► Kofi suppress (grows each mission)
     └─► Araba breach OR Riot Rally if Kojo trapped
```

---

## Character docs

- [Kojo — Cell Leader](kojo-cell-leader.md)
- [Kwesi — Clerk](kwesi-clerk.md)
- Araba, Kofi, Yaw — see [`STORYLINE.md`](../../STORYLINE.md) §14

---

## Name collisions (critical)

| Name | Who |
|------|-----|
| **Kofi Asare** | Phase I–III double-agent clerk |
| **Kofi** | Phase IV rookie skirmisher |
| **Kwesi** | Phase IV Secretariat intel clerk |
| **Kojo** | Phase IV cell leader (combat) |

Never merge these in UI or dialogue.
