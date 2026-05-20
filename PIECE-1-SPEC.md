# PIECE-1-SPEC.md — Biblioteca: unificación y ampliación

> Especificación para Claude Code. Estado: LISTA para sub-paso 1.1.
> Lee CLAUDE.md antes. Solo este repo (Procesador.html). El scraper es proyecto aparte.
> Tres sub-pasos, tres commits, EN ESTE ORDEN. No los mezcles.

## Objetivo

Eliminar la división de dos bases de datos para que el plan de ingestas se beneficie de
las 437 entradas de `FOOD_DB`, unificar la Biblioteca en una sola vista y ampliar la base.

## Por qué este orden (no el del backlog)

Dependencia real: ampliar `FOOD_DB` no sirve al plan mientras el plan lea de `FOODS`
(lección "two separate DBs" del CLAUDE.md). Por eso 1.1 es la pieza maestra y va primero.

---

## Sub-paso 1.1 — Unificar FOODS → FOOD_DB  (PRIMERO, pieza maestra)

### Problema
`FOODS` (~línea 2703, ~50 entradas, solo `{kcal, ch, prot, gras}`) alimenta `updateFood()`
y el `<datalist id="food-list">` del plan. `FOOD_DB` (~línea 390, 437 ítems, campos
`{kcal, p, c, g, fi, ...}` + categoría + `FOOD_ALIASES`) solo se usa en la Biblioteca.
Objetivo: que el plan use `FOOD_DB` como fuente, con autocálculo de macros.

### Reglas duras
- **NO cambiar la forma del objeto de opción** `{name, grams, measure, kcal, ch, prot, gras}`.
  Lo consumen `calcOptionTotal()` y `exportarExcel()`: cambiarlo provoca efecto dominó.
  Solo cambia la FUENTE del lookup y la población del datalist, con un adaptador de campos.
- **Mapeo de campos** `FOOD_DB → opción`: `p→prot`, `c→ch`, `g→gras`, `kcal→kcal`. Centraliza
  ese mapeo en una sola función auxiliar; no lo repartas.
- **No borrar `FOODS`.** Déjalo como fallback: si un nombre no está en `FOOD_DB`, usar
  `FOODS`. Cirugía, no reescritura. Una limpieza posterior lo retirará si se confirma muerto.
- **Datalist** `food-list`: poblarlo con los nombres de `FOOD_DB` (437 `<option>` está bien).
- **Lookup en `updateFood()`**: match exacto por nombre contra `FOOD_DB` (el datalist da
  nombres exactos) con normalización de acentos como respaldo. NO arrastres el scoring
  difuso completo de `filterFreshFoods` aquí (scope creep). `FOOD_ALIASES` como mejora
  posterior, anótalo pero no lo implementes ahora.
- Comprueba si `updateFood()` está definida varias veces (como `renderLibraryTab`).
  Modifica SOLO la versión activa (la última). PROHIBIDO el patrón `var _orig = updateFood`
  (ver "Override pattern & its trap" en CLAUDE.md).

### Test de aceptación (no terminar hasta que pasen todos)
1. Escribir en una casilla del plan un alimento que esté en `FOOD_DB` pero NO en `FOODS`
   (uno de los 437 que no estén en los ~50) → los macros se autocompletan correctos.
2. Los ~50 alimentos antiguos siguen autocompletando igual que antes.
3. Un `datos_paciente_*.json` real carga sin error.
4. `exportarExcel()` sigue generando el Excel sin romperse (forma de opción intacta).
5. Acentos: "platano" encuentra "plátano".

---

## Sub-paso 1.2 — Biblioteca unificada  (DESPUÉS, commit aparte)

Colapsar las sub-pestañas (Frescos · Open Food Facts · METs) de la Biblioteca en una sola
vista de búsqueda + tabla. Tocar la ÚLTIMA definición de `renderLibraryTab` (~6650,
"DEFINITIVA CON BD LOCAL"). Conservar `filterFreshFoods` como motor de búsqueda intacto.
Riesgo: zona del patrón de override; no introducir wrappers `var _orig`. Test: la búsqueda
sigue funcionando con acentos y orden de resultados igual; METs accesible en la vista única;
la API en vivo de Open Food Facts sigue operativa.

## Sub-paso 1.3 — Ampliar FOOD_DB  (ÚLTIMO, commit aparte)

Añadir ítems a `FOOD_DB` manteniendo el esquema `{kcal, p, c, g, fi, ...}` + categoría, y
sincronizando `FOOD_CATS` y `FOOD_ALIASES`. Tras 1.1 estos ítems benefician al plan
automáticamente. Es el punto donde más adelante entrarán los datos del scraper (BEDCA y
recetas). Test: ítems nuevos buscables en Biblioteca y autocompletan en el plan; suelo de
seguridad respetado; ningún ítem rompe filtros.

## Salvaguardas (recordatorio)
- Plan Mode siempre: plan → OK → implementar.
- Un sub-paso, un commit, diff mínimo. No reformatear código ajeno.
- Verificar carga de JSON real y export Excel tras cada sub-paso.
