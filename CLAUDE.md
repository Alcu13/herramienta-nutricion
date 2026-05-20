# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in
this repository. Read it fully before touching anything. If a user instruction conflicts
with a NON-NEGOTIABLE PRINCIPLE, stop and flag it before proceeding.

## Project Overview

A two-file nutritionist tool for creating personalized meal plans. No build system, no
dependencies, no package manager — everything runs directly in the browser as standalone
HTML files. Solo practice context (one nutritionist, no team, no server infra).

- **Formulario.html** — Patient intake questionnaire. Outputs a `.json` file that the
  patient sends to the nutritionist.
- **Procesador.html** — Main tool (~10 000 lines). Loads the patient JSON, displays their
  profile, and lets the nutritionist build day-type ("días tipo") meal plans and export
  to Excel.

> NOTE — out of this repo: `scraper_alimentos_es.py` (the Spanish food scraper that builds
> an SQLite DB) is a SEPARATE project, not part of these two files. Work on it happens in
> its own session/repo. See "Roadmap" for how it relates.

## NON-NEGOTIABLE PRINCIPLES

- **Standalone, zero server.** Everything is HTML runnable locally. Do not introduce build
  steps, frameworks, bundlers, backends, or server dependencies. If an improvement seems to
  "need" a server, propose a server-less alternative first.
- **No API key in client.** Never embed keys in HTML. If a feature needs AI, raise it and
  discuss architecture first; default to a deterministic engine.
- **Patient-facing content in Spanish, plain language.** No jargon (no GET, TEF, g/kg) in
  anything the patient sees. Technical jargon lives only in the nutritionist's tool.
- **Surgery, not rewrites.** Fix with minimal, localized changes. Do not rewrite whole
  files or "clean up along the way." Every change must be reviewable as a small diff.
- **Visual output over text tables.** SVG/Gantt, weekly planners, color-coded tabs.
- **Collect once, reuse.** Data entered once propagates and pre-fills downstream.
- **One piece per session and per commit.** Keep concerns isolated. Procesador.html and any
  scraper work are different sessions and different commits — never mixed.

## Domain vocabulary (do not "translate" or simplify)

ingestas · NEAT · RPE · timing nutricional · periodización · GET/TEE · MET · TEF · días tipo

## Architecture of Procesador.html

The entire application is a single `<script>` block. There is no module system. Functions
defined later in the file override earlier ones with the same name — **this pattern is used
deliberately for progressive enhancement** (see "Override pattern & its trap" below before
relying on it).

### Key globals

| Name | Line | Purpose |
|---|---|---|
| `FOOD_DB` | ~390 | Array of 437 food objects with full nutrition data (kcal, p, c, g, fi, vitamins). Single source of truth for foods (Biblioteca AND meal plan, after Piece 1.1). |
| `FOOD_ALIASES` | ~851 | Object mapping `FOOD_DB` item names → arrays of search synonyms. Used by `filterFreshFoods` and `initFoodList`. |
| `FOOD_CATS` | ~2558 | Array of category strings for the "add food" modal. Must be kept in sync with categories used in `FOOD_DB`. |
| `FOODS` | ~2703 | Legacy minimal object (~50 entries, `{kcal, ch, prot, gras}` per 100g). After Piece 1.1 it is only a lookup-on-miss FALLBACK if a typed name is not found in `FOOD_DB`. It does NOT populate the datalist. Slated for removal once confirmed unused. |
| `state` | runtime | Holds `dayTypes`, patient profile, and ID counters. Populated by `readJSONFile()` or `loadManualData()`. |
| `MEAL_EMOJIS` | ~2700 | Maps meal type names to emoji. Keys are the valid meal type values. |

### Single source of truth for foods (post-1.1)

`FOOD_DB` is the canonical list. The meal-plan datalist (`food-list`) is populated by
`initFoodList` from `FOOD_DB` only. `FOODS` is retained as a silent fallback for legacy
typed names not present in `FOOD_DB`; it never contributes to the datalist. Adding a food
in `FOOD_DB` makes it available everywhere (Biblioteca + meal plan + auto-macros). Before
adding any "parallel" food list, consolidate — see "Consolidate, don't duplicate" lesson.

### Screen/tab flow

1. App opens on `#screen-load` (file upload + manual form).
2. `readJSONFile()` or `loadManualData()` populates `state` and calls `showScreen('screen-plan')`.
3. `screen-plan` contains tabs: **Resumen · GET · Plan de ingestas · Exportar Excel · Biblioteca**.
4. `showTab(name)` switches content panels inside `screen-plan`.

### Biblioteca tab — multiple overrides

`renderLibraryTab()` is defined **6 times**. The active version is always the **last** one
(line **9549**, labelled `DEFINITIVA v2: Biblioteca con pestaña Recetas`). It renders
three sub-tabs:

| Button id | Label | Panel id | Default |
|---|---|---|---|
| `lib-btn-frescos` | 🍽️ Alimentos | `lib-frescos` | visible |
| `lib-btn-recetas` | 📋 Recetas | `lib-recetas` | hidden |
| `lib-btn-mets` | 🏃 Actividades/Deportes | `lib-mets` | hidden |

`lib-frescos` contains the food search (calls `filterFreshFoods`). `lib-mets` contains the
MET reference table. `lib-recetas` is populated lazily by `renderRecipesPanel()`.

**Open Food Facts status:** `debouncedOFRLib` and `doOFRLibSearch` are defined (lines
7332/7339 first pair, 8355/8366 active pair) but are **not wired to any visible UI** in
the active `renderLibraryTab`. The `lib-ofr` panel existed in older definitions (line 7223,
not active). OFR is currently inaccessible from the Biblioteca; reconnecting it is part of
sub-step 1.2.

The active search function is `filterFreshFoods(q, cat)` (line **8284**); `initFoodList`
is at line **5820**.

> **Technical debt (not in scope of 1.2):** The 6 stacked `renderLibraryTab` definitions
> and the orphaned `debouncedOFRLib`/`doOFRLibSearch` pair at lines 7332-7337 are
> recognised dead weight. Consolidating them into a single clean definition is a separate
> cleanup task, not part of any current sub-step.

### Meal plan (Días Tipo)

- `renderDayTypeBlock(dt)` → `renderMealBlock(dtId, meal)` → `renderOptionCol(dtId, mealId, opt, foods)`
- Each meal has three options (A/B/C). Each option is an array of
  `{name, grams, measure, kcal, ch, prot, gras}`. Do not change this shape — it is consumed
  by `calcOptionTotal()` and `exportarExcel()`.
- Food name input uses `<input list="food-list">` (HTML datalist). After Piece 1.1 the
  datalist is populated by `initFoodList` from `FOOD_DB` (with accent-less variants for
  accented names appended directly, bypassing `addOpt`).
- `saveFoodField()` handles input/change events; macro auto-fill uses `_lookupFoodSimple`,
  which queries `FOOD_DB` with `_normFood` normalization and falls back to `FOODS` on miss.
- `medida()` converts grams → colloquial household measure string (e.g. "1 taza", "½ palma").
- `calcOptionTotal()` sums macros for one option column.

### Excel export

`exportarExcel()` uses the ExcelJS library (loaded from CDN). It iterates `state.dayTypes`
and writes one sheet per day type with meal options and macro totals.
**Decided:** Excel is the nutritionist's INTERNAL working tool and stays. A separate
patient-facing PDF deliverable will be added in Piece 3 (the two coexist; Excel is never
shown to the patient).

### Search algorithm (`filterFreshFoods`)

- Strips accents via `String.normalize('NFD')` + regex on combining diacritics range
  (this is what `_normFood` does — reuse it; do not write a parallel normalizer).
- Splits query into words; all words must match (AND logic).
- Searches: normalized food name + normalized category + normalized aliases from `FOOD_ALIASES`.
- Sorts: exact prefix match first, then substring match, then alphabetical.

## Override pattern & its trap — mandatory reading

Progressive enhancement by redefining a function later in the script is INTENDED and fine
(last definition wins; e.g. the 5 `renderLibraryTab` definitions). The trap:

- **NEVER** wrap a function with `var _orig = fnName; function fnName() { ... _orig() ... }`.
  `function` declarations hoist, so `_orig` ends up pointing at the latest (hoisted)
  declaration — itself — causing infinite recursion. If you need previous behavior, inline
  it or rename; do not capture it via `var _orig`.
- If conflicting implementations must be reconciled, put the final, self-contained,
  non-recursive versions in one cleanup block at the very end of the script; being last,
  they win the hoisting competition. Do not break that final block.

## Other bug lessons — mandatory rules

- **Layered diagnosis.** Always wrap `JSON.parse` and the subsequent data load
  (`readJSONFile` path) in independent try-catch blocks. A past "invalid JSON" was actually
  a stack overflow inside the loader; the surface error message lies. More generally:
  before fixing, prove which layer fails — the visible symptom routinely misnames the real
  cause. When debugging stalls, ask for raw data from the running DOM instead of refining
  the next theory.
- **Search thresholds.** Accent normalization is already implemented. If the AND-all-words
  logic is ever relaxed, add word-overlap scoring + a ~40% minimum match threshold to
  avoid false positives, and never silently lower a threshold.
- **HTML structure after edits.** A single stray `</script>` once rendered JS as page
  text and broke all navigation. After editing this ~10 000-line single-script file,
  validate tag structure before considering the change done.
- **PDF (Piece 3).** When the patient PDF is built, HTML-to-PDF only works with the
  full-screen overlay technique; off-screen divs / opacity tricks produce blank output.
- **Consolidate, don't duplicate (recurring failure mode).** This project's #1 bug source
  is two parallel implementations of one concept drifting apart: `FOOD_DB` vs `FOODS`, and
  two accent normalizers. Rules: `FOOD_DB` is the single list source (deduped by normalized
  name); `FOODS` is a lookup-on-miss fallback only, never a list contributor. There is ONE
  accent-normalization function (`_normFood`), shared by `filterFreshFoods` and the
  meal-plan lookup. Before adding any "parallel" helper/DB, consolidate.
- **Native datalist filtering is accent-sensitive.** An `<input list>` dropdown is filtered
  by the browser, not by our JS, and Chrome does NOT ignore accents (it does ignore case).
  JS lookup (`_normFood`/`_lookupFoodSimple`) can be correct while the visible suggestions
  still fail. Fix at the datalist source (`initFoodList`). Never assume "doesn't find it"
  is a search-logic bug; check first whether the browser or our JS is doing the filtering.
- **`_normFood` conflates case and accents.** It lowercases AND strips accents in one step,
  so it cannot tell a case-only difference ("Mango"/"mango", browser-resolvable) from an
  accent difference ("Plátano"/"platano", NOT browser-resolvable in a native datalist).
  When you need that distinction, compare `s.toLowerCase()` vs `_normFood(s)`: differ ⇒ the
  string has accents (add the accent-less datalist option); equal ⇒ case-only (do not add,
  it duplicates).
- **Dedup key collisions hide needed entries.** `initFoodList`'s `addedNorm` dedups by
  `_normFood(value)`. The accent-less variant of an accented food has the SAME normalized
  key as its canonical name, so adding the canonical ("Plátano") marks `"platano"` as seen
  and the needed variant is silently skipped — symptom: typing "platano" finds nothing
  while the JS lookup still computes macros. The accent-less variant for accented names
  must be appended to the datalist directly, bypassing `addOpt`. Before debugging
  display/normalization logic, verify the raw datalist contents
  (`document.querySelectorAll('#food-list option')`) — assumed-present data was false for
  6 iterations here.

## Patient JSON contract (version 2.0)

Top-level keys: `_version` ("2.0"), `_exportDate`, `paciente`, `salud`, `rutina`,
`actividades` (array), `semana` (object per day with `actividadesTexto[]` and `comidas[]`,
each meal `{tipo, hora}`), `alimentacion` (`alergias`, `tipoAlimentacion`, `gustos`,
`noGusta`, `disponible`), `comidasHabituales` (desayuno…picoteoNoche, extra), `objetivos`
(`principal`, `secundario`, `plazo`), `habitos` (sueño, agua, bebidas), `adherencia`,
`fueraDeCasa`. Non-applicable fields arrive as `null` or `""` — handle defensively, never
assume a field exists. Do not rename keys without a matching migration in Formulario.html.

## Calculations (keep formulas)

- BMR: Mifflin-St Jeor. Men: `10*kg + 6.25*cm - 5*age + 5`.
- GET: MET breakdown over exactly 24h (sleep, work/study, training, fixed NEAT, auto-
  adjusting rest/BMR row). TEF at 10%.
- Plan: protein and fat in g/kg; carbs auto-calculated from the remainder. Calories
  anchored by objective (maintenance = GET; loss = GET−400; gain = GET+400).
- **Safety floor:** never produce a daily target below a prudent minimum by
  sex/composition, even if the math allows it.

## Pending architectural changes (planned) & Roadmap

The repo's own backlog, mapped to the agreed roadmap:

1. **Unified Biblioteca** — collapse into a single search+table view; remove sub-tabs.
2. **Connect meal plan inputs to FOOD_DB** — DONE (Piece 1.1, post-1.1 architecture above).
3. **Expand FOOD_DB** — add more items for plan variety.

Roadmap mapping (priority order):

- **Piece 1 — Library.** In THIS repo: items #1 + #2 + #3 above. Sub-step 1.1 (#2) is
  closed. Next sub-steps: 1.2 (unified Biblioteca UI) and 1.3 (expand `FOOD_DB`). The
  BEDCA + recipes work lives in the SEPARATE scraper project and feeds `FOOD_DB` data;
  it is not done in this repo.
- **Piece 2 — Rules suggestion engine.** New capability. Pure module
  `generarSugerencias(pacienteJSON, objetivosPorDiaTipo, consultarBiblioteca)` with no DOM.
  Integration targets here: the GET tab (source of per-día-tipo targets), `FOOD_DB` via a
  `filterFreshFoods`-style query as `consultarBiblioteca`, and the meal-plan pipeline
  `renderDayTypeBlock → renderMealBlock → renderOptionCol` (fills A/B/C + a plain-Spanish
  justification). Decision support only — nothing auto-commits to the plan. Full spec:
  `PIECE-2-SPEC.md`.
- **Piece 3 — Patient PDF deliverable.** DECIDED: keep `exportarExcel()` as the
  nutritionist's internal tool; ADD a separate patient-facing PDF (plain Spanish, visual,
  household measures, the approved prototype design). They coexist; the patient never sees
  the Excel. Build with the full-screen overlay technique (see bug lessons).
- **Piece 4 — EvalFINUT 2.0.** External QA tool, parallel, no code integration.

## Working agreement with Claude Code

- Always start in Plan Mode: propose the plan, wait for approval, then implement.
- Touch the minimum number of files; do not reformat unrelated code.
- After changes to Procesador.html, verify a real patient JSON (`datos_paciente_*.json`)
  loads without error before considering the task done.
- When a fix does not work on the second try, stop and ask for raw runtime data from the
  browser console before producing a third theory (lesson: 1.1 took 7 iterations because
  this was skipped).
- Before creating any function-wrapping pattern, re-read "Override pattern & its trap".
- Small commits, imperative messages, one piece per commit.
