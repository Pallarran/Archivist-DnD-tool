# Archivist DnD Tools — Product Spec v0.1.2

## 1) Vision & Scope
**Goal:** A joyful, rigorous optimizer for D&D 5e (2014-era rules + pre‑2024 supplements) that helps players design, compare, and simulate character builds—without spreadsheet gymnastics.

**Distribution:** The app lives in a **GitHub repository** and is **accessible in any modern browser** as a **static PWA** (Progressive Web App) deployed via **GitHub Pages**.

**MVP Modules**
- **DPR Simulator** (flagship): side‑by‑side comparison of up to **3 builds**, **3‑round combat timeline**, support for attacks, spells, features, feats, buffs/debuffs, crit mechanics, once‑per‑turn effects, and on‑turn/off‑turn actions.
- **Leveling DPR Explorer (1–20):** visualize DPR curves per level for up to 3 builds, with highlights on major breakpoints (Extra Attack, subclass features, ASIs/feats), advantage state sweeps (normal/adv/disadv), and Sharpshooter/GWM threshold overlays.
- **Character Compare**: qualitative + quantitative comparison of utility (skills, mobility, control, defense), resource economy (spell slots, points, rages), **feature/spell diffs**, and progression curves.
- **Build Lab**: lightweight builder that captures enough data to power simulations; imports/exports JSON; safe for homebrew toggles.

## 2) Design Principles
- **Rules-first** (2014 + pre‑2024 books): opt‑in modules for XGtE, TCoE, SCAG, etc. Clear book/source toggles.
- **Complete class & subclass coverage:** select **any** 2014‑era class/subclass; arbitrary multiclassing up to total level 20 with per‑source toggles and prerequisites enforced.
- **Deterministic math + policy-driven simulation:** analytic formulas for hit/crit/save plus Monte Carlo mode for complex triggers. Player intent encoded with **policies** (e.g., “smite on crit”, “use -5/+10 if EV ≥ X”).
- **Explainable outputs:** every number is clickable to a breakdown (probabilities, dice EVs, advantage math, once‑per‑turn logic).
- **Portable & browser‑native:** PWA that runs fully client‑side, installable on desktop/mobile, offline‑first with local saves.

## 3) User Personas
- **Optimizer**: min‑maxer comparing Sharpshooter vs. non‑SS lines at various ACs.
- **Tactician**: script opening rounds (buff → nova → sustain), understand concentration tradeoffs.
- **GM/DM**: sanity‑check monsters vs. party DPR.

## 4) Information Architecture
**Top Nav:** Build Lab • DPR Simulator • Leveling Explorer • Compare • Library • Exports

**Library:** Conditions & Buffs, Spells, Features/Feats, Weapons & Gear, Enemy Templates. Each is a composable effect object.

**Build Object (core schema)**  
*Supports any 2014‑era class/subclass and arbitrary multiclassing (total levels ≤ 20).* 
```json
{
  "name": "Kaelen EK/Scout",
  "levels": [{"class":"Fighter","subclass":"Eldritch Knight","level":11},{"class":"Rogue","subclass":"Scout","level":9}],
  "abilities": {"STR":8,"DEX":18,"CON":14,"INT":16,"WIS":12,"CHA":9},
  "proficiencyBonus": 6,
  "proficiencies": {"weapons":["longbow"],"saves":["STR","CON"]},
  "feats":["Sharpshooter","Elven Accuracy"],
  "fightingStyle":"Archery",
  "features":["Sneak Attack","Eldritch Strike","Action Surge"],
  "equipment": {"mainHand": {"type":"longbow","die":"d8","magic":1,"properties":["ammunition","two-handed"]}},
  "spellsKnown":["Shield","Absorb Elements","Haste"],
  "spellSlots": {"1":4,"2":3,"3":2},
  "policies": {
    "powerAttackThresholdEV": 0.5,
    "smitePolicy":"onCrit",
    "oncePerTurnPriority":"firstHit",
    "bonusActionPriority":["HM","offhand","GWM-BA-Crit"],
    "precast": ["Hex"],
    "resourceBudget": {"slotsPerFight": {"1":1,"2":0,"3":0}}
  }
}
```

## 5) DPR Simulator — UX Flow
**Layout:** 3 columns (Build A/B/C). Each column has **Inputs**, **Policy**, **Round Script**, **Results**. Shared **Target Panel** floats at the top.

**Target Panel**
- AC (slider + numeric). 
- Resist/Immune/Vulnerable toggles per damage type.
- Saves (STR/DEX/CON/INT/WIS/CHA modifiers).
- Enemy traits (e.g., Magic Resistance, Evasion/Improved Evasion, Reaction: Shield—expected use %, Legendary Resistance charges for save‑gated effects).
- Target count for AoE.

**Build Inputs**
- Attack profile(s): to‑hit bonus, crit range, num attacks/round, damage dice, riders (Hex/HM/Divine Strike/Sneak Attack), reroll mechanics (Great Weapon Fighting, Flames of Phlegethos, Elemental Adept), on‑crit dice doubling rules, smite/additional dice on crit.
- Advantage state: normal/adv/disadv; Elven Accuracy; Halfling Luck; bless/bane/bardic inspiration/cutting words; custom die bonuses/penalties.
- Bonus action/Reaction options: off‑hand, GWM bonus on crit, Polearm Master OA chance, Battlemaster Riposte (with trigger probability), Warcaster OA cantrip.
- Spell attacks vs. save-based effects (DC and save mod); save riders (half on save, negates, Evasion).
- Resources: slots/points/superiority dice; expected use per 3‑round encounter.

**Policy & Scripting**
- **Per‑round script (optional):** e.g., R1: Bonus Action Hex → Attack ×2; R2–R3: Attack ×2.
- **Policy engine (if no explicit script):** maximize EV subject to
  - Power attack toggle when EV(−5/+10) ≥ EV(normal) + threshold.
  - Smite usage rule (never/first‑hit only/on crit/only above CR X).
  - Sneak Attack usage = first hit that qualifies.
  - Concentration priority list.
- **Off‑turn policy:** OA chance %, Riposte trigger %, Sentinel proc chance, Reaction competition (e.g., keep reaction for Shield vs. Riposte).

**Results View**
- **Headline:** DPR per round (R1/R2/R3), 3‑round total, sustained DPR.
- **Advantage sweep:** side‑by‑side mini‑charts for **normal / advantage / disadvantage**; show deltas vs. baseline.
- **Sharpshooter/GWM Advisor:** break‑even AC thresholds per advantage state and buff stack (e.g., Bless, Archery), with inline recommendation badges like “SS on ≤ AC 18 (adv + Bless)”.
- **Breakdowns:** hit vs. crit contributions; once‑per‑turn allocation; bonus action share; resource‑derived damage; off‑turn contribution; damage type split.
- **Sensitivity panel:** micro‑graphs of DPR across AC 12–22; overlay power‑attack on/off and advantage states.
- **Trace panel:** step‑by‑step math for one round (expandable), including probability trees for advantage, bonus dice, and once‑per‑turn effects.

## 5a) Leveling DPR Explorer (1–20)
**Purpose:** See how each build’s DPR evolves **from level 1 to 20** and where key breakpoints change the curve.

**UX**
- **Level timeline slider** (1–20) with snap‑to breakpoints (ASI/feat levels, Extra Attack, subclass features, new spell levels).
- **Multi‑line chart** (Build A/B/C): DPR per level; hover reveals inputs used (to‑hit, number of attacks, dice, buffs).
- **Feature lane** under the chart: icons/labels for features/spells that come online that level (e.g., “Extra Attack”, “Sharpshooter”, “Haste”).
- **Advantage state toggles**: normal/adv/disadv quick‑switch; optional “stack” view to show all three simultaneously.
- **Sharpshooter/GWM overlay**: show on/off curves and the **break‑even AC** as a vertical marker per level.
- **Export**: CSV of DPR-by-level per build + key assumptions.

**Engine notes**
- Auto‑populate class tables (attacks known, slot progression, SA dice, superiority dice) based on class/subclass/multiclass, respecting 2014 rules.
- Respect prerequisites/taxonomy from selected sources; warn if a planned feat or spell is unavailable at a level.

## 6) Math & Engine Notes
- **Deterministic core:** analytic probabilities for hit, crit, advantage/disadvantage, Elven Accuracy, Halfling Luck, bonus/penalty dice via discrete convolution (e.g., Bless + Bardic Inspiration), save math, and “save for half/negate/evasion” rules.
- **Advantage state sweeps:** compute DPR under normal/adv/disadv and derive Sharpshooter/GWM break‑even AC per state and buff suite.
- **Once‑per‑turn logic:** probability of ≥1 hit per phase (main vs. bonus), crit‑first distributions, correct double‑count prevention.
- **Crit mechanics:** expanded crit ranges (Champion, Hexblade’s Curse), dice doubling on crit with on‑crit adders (e.g., Savage Attacker excluded, Brutal Critical included where applicable).
- **Reroll & substitution:** Great Weapon Fighting, Elemental Adept, Flames of Phlegethos stacking.
- **Power‑attack heuristics:** compute EV(normal) vs. EV(−5/+10) per attack context; expose rule curve and recommended AC thresholds.
- **Monte Carlo mode:** replicate 100k trials for sequences with stateful branching (Legendary Resistance choices, reaction competition, conditional smites). Seeded RNG, report confidence intervals.

## 7) Character Compare — Beyond DPR
**Dimensions (with sliders for table weighting):**
- **Defense:** AC curve, HP, resistance coverage, reactive mitigation (Shield, Absorb Elements), concentration staying power.
- **Control:** reliable conditions (Prone, Restrained, Stunned), save type coverage, target count.
- **Mobility/Positioning:** speed, flight, teleport, shove/grapple package, OA control (Sentinel/Booming Blade OA).
- **Utility:** rituals, languages/tools, social leverage, exploration toolkit.
- **Resource Economy:** slots/points per adventuring day, short/long rest pacing, per‑nova vs. sustained.
- **Skill Profile:** proficiencies/expertise and passive scores.

**Outputs:**
- **Radar chart + rubric table** with user‑weighted categories.
- **Spell slot & resource timeline** by level.
- **Breakpoints** (Extra Attack, 3rd‑level spells, feat online, subclass features).
- **Feature & Spell Diff panel:** side‑by‑side list of **class features** and **spells** per build with tags (concentration, action type, save, damage/control/utility), filters (e.g., “show only concentration spells” or “show reaction‑based features”), and tooltips explaining each item’s mechanical hooks.

## 8) Library: Effects-as-Objects
Each feature/spell/feat is a **composable effect** with:
- **hooks:** onAttackRoll, onHit, onCrit, onDamageRoll, onSave, onFailSave, onKill, perTurnLimiter, duration, concentration, resourceCost.
- **modifiers:** toHit, damageDice, damageBonus, dieReroll, critRangeDelta, advantageState, addBonusDie (with die expression), saveMode (negates/half/evasion), targetCount.
- **stacking rules:** replaces vs. stacks, mutually exclusive groups.
- **source tags:** book/page, prerequisites.

This affords homebrew by adding new effect objects—no core math rewrite.

## 9) UI Details & Visual Language
- **Three‑column compare** with sticky Target Panel.
- **Policy chips** (e.g., “SS on EV≥0.5”) visible beneath attack blocks.
- **Inline EV badges** on toggles (e.g., “Bless +2.1% hit”).
- **Diff mode:** highlight per‑round differences across builds.
- **Mobile:** card stack; swipe between builds; collapsible sections.

## 10) Tech Choices
- **Frontend:** React + TypeScript, Zustand for state, Zod schemas, Vite build.
- **Math core:** pure TS library (tree‑shakeable), with wasm option later for Monte Carlo speed.
- **Data:** localStorage + optional file exports; PWA installable.
- **Hosting:** **GitHub Pages** (static site). SPA‑safe routing via `index.html` + `404.html` fallback. Vite `base` configured to `"/<repo-name>/"` for asset paths.
- **CI/CD:** GitHub Actions workflow to build (`npm ci && npm run build`) and deploy the `dist/` folder to Pages on push to `main`.
- **Testing:** Vitest for unit tests; golden‑case tests that mirror known spreadsheet scenarios; property tests for probability invariants.

## 11) Deployment & Repository — Browser Access
- **Repo layout**
  - `/src` (React/TS app), `/public` (favicon, manifest, icons), `/index.html`, `/404.html` (SPA fallback), `vite.config.ts` (with `base`), `package.json`.
- **Pages configuration**
  - Enable **GitHub Pages** (Build and deployment → GitHub Actions).
  - Workflow at `.github/workflows/pages.yml` builds and uploads `dist/` artifact, then deploys to Pages.
- **Routing**
  - SPA fallback with `404.html` copied from `index.html` to handle deep links.
- **PWA**
  - Web app manifest + service worker (workbox or Vite plugin) for offline cache and install prompt.
- **Environment**
  - No server‑side secrets; everything client‑side. Optional, user‑provided JSON imports remain local.

## 12) Validation Suite (golden cases)
- Basic weapon attack vs. AC 10–22 (no features).
- Advantage/disadvantage & Elven Accuracy sanity.
- Bless/Bane/Bardic Inspiration correctness tables.
- Once‑per‑turn effects (Sneak Attack) on multi‑attack sequences.
- Save‑for‑half, Evasion, Elemental Adept edge case.
- Power‑attack EV switching thresholds by AC.
- Crit‑triggered bonus action (GWM) vs. baseline bonus action.

## 13) Roadmap
**MVP (Weeks 1–3)**
- Repo bootstrapped with Vite + React + TS; Pages workflow; PWA skeleton.
- Build object + Library skeleton; deterministic DPR for weapons; 3‑column UI; Target Panel; basic policies; JSON import/export.
- **Leveling DPR Explorer (basic):** per‑level DPR from 1–20 using core weapon math and feature timelines.

**v0.2**
- Spells & save effects; AoE multi‑target; off‑turn events; sensitivity graphs; policy tuning; Explain panel.
- **Sharpshooter/GWM Advisor** + advantage state sweeps in UI.

**v0.3**
- Character Compare with weightable rubric and slot timeline; Monte Carlo mode; homebrew editor; shareable links.
- **Feature & Spell Diff** with filters/tags.

**v0.4**
- Encounter Packs (common buff suites), multiple enemies, party synergy toggles; export to PNG/PDF.

## 14) Risks & Non‑Goals
- **Licensing/content:** ship only SRD‑safe data; user-provided compendium details via imports.
- **System scope:** pre‑2024 rules only; future module can add 2024 variants behind a flag.
- **Infra:** no backend service; Pages‑only static hosting by design.

## 15) Nice‑to‑Haves
- Import from common builders (JSON), if user supplies.
- “Breakpoint Finder” (e.g., Dex 18→20 vs. Feat X; DPR and control deltas).
- “Shield math” (expected hits prevented per reaction for defense compare).

## 16) Example Targets & Presets
- Humanoid AC bands (12/14/16/18/20/22).
- Classic dummies: Low-save Brute, High-DEX Skirmisher, Magic-Resistant Elite.

## 17) Instrumentation
- Exportable **trace logs** per sim run (for bug reports & verifiability).

## 18) Accessibility & i18n
- Keyboard-nav, aria labels, color‑safe charts, number formats.

---
**Next step**: stand up the GitHub repo scaffold (Vite PWA + Pages workflow), then prototype the three‑column simulator and Leveling Explorer for real‑browser testing.
