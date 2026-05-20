# BACKLOG

Pila de bugs y mejoras detectadas durante el desarrollo, fuera del
alcance de la pieza en curso. Atacar cada una con su propio plan,
diagnóstico y commit, en el orden acordado con el mentor.

## Bugs

### BUG-001 — Macros por día tipo idénticos en todos los días (Excel)
Detectado: tras cerrar 1.2.
Síntoma: en "OBJETIVOS NUTRICIONALES POR DÍA TIPO" del Excel, las
columnas CH (149g), PROT (144g) y GRAS (72g) son idénticas en los 5
días tipo, mientras que KCAL OBJETIVO sí varía (3247, 3498, 4000,
3608, 3106). Aritmética no cuadra: 149·4 + 144·4 + 72·9 = 1820 kcal,
muy por debajo del GET de cualquier día.
Hipótesis: los hidratos no se recalculan por día contra el GET
correspondiente; el motor calcula los macros una sola vez y los
aplica a todos los días.
Severidad: clínica. Afecta la periodización real del plan.
Estado: pendiente.

### BUG-002 — "Desde receta" no rellena ch ni gras en macros de opción
Detectado: tras cerrar 1.2.
Síntoma: al añadir una receta con varios alimentos a una opción del
plan, el total muestra "892 kcal · CH 0g · P 52.4g · G 0g". La
proteína y las kcal suman, pero ch y gras quedan a cero. Añadir
alimentos uno a uno con el autocompletado sí calcula bien todos los
campos.
Hipótesis: la función que carga ingredientes de receta no rellena
todos los campos del objeto de opción ({name, grams, measure, kcal,
ch, prot, gras}); olvida ch y gras.
Severidad: clínica. Las recetas dan macros falsos.
Estado: pendiente.

## Mejoras / housekeeping

### TASK-002 — Documentar el colapso de outputs de Claude Code en CLAUDE.md
Detectado: sesión de verificación de coautoría, 2026-05-20.
Síntoma: Claude Code colapsa outputs largos de terminal con "+N lines
(ctrl+o to expand)". Claude puede concluir sobre contenido que el
usuario no puede ver sin expandir manualmente.
Acción: añadir en "Working agreement with Claude Code" el aviso:
"Claude Code's terminal interface collapses long outputs by default
(shown as '+N lines (ctrl+o to expand)'). Conclusions drawn over
collapsed sections must be verified by running the command in a
separate terminal, or by expanding manually with ctrl+o. Never approve
critical decisions based on collapsed output."
Estado: pendiente.

### TASK-003 — Verificar en GitHub que los commits limpios no llevan Co-Authored-By
Detectado: sesión de verificación de coautoría, 2026-05-20.
Al primer push, comprobar en la interfaz web de GitHub que los commits
3fae597, 4aefee6 y 3d83752 no muestran coautoría en el cuerpo público.
Si alguno la llevara, enmendar antes de cerrar el push.
Estado: pendiente (bloqueado hasta el primer push).

---
Notación: cada entrada lleva su id (BUG-NNN o TASK-NNN), fecha o
referencia de detección, síntoma observable, hipótesis si la hay,
severidad y estado. Cerrar una entrada = mover a una sección
"## Cerrados" al final con su commit asociado.

## Cerrados

### TASK-001 — Versionar PIECE-1-SPEC.md y PIECE-2-SPEC.md
Detectado: tras commit 5a1a5d1.
Los dos archivos de especificación de pieza estaban en la carpeta del
repo pero no versionados. Misma situación que el CLAUDE.md antes del
commit f1bf229.
Acción: git add ambos + commit "Versiona especificaciones de pieza".
Estado: cerrado — commit 4aefee6.
