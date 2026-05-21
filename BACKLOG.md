# BACKLOG

Pila de bugs y mejoras detectadas durante el desarrollo, fuera del
alcance de la pieza en curso. Atacar cada una con su propio plan,
diagnóstico y commit, en el orden acordado con el mentor.

## Bugs

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

### TASK-004 — Ampliar FOOD_DB con la lista clínica del nutricionista (1.3)
Detectado: sesión de preparación del 1.3, 2026-05-21.
El nutricionista ha entregado una lista priorizada de ~130 alimentos
que considera críticos para arrancar consulta. La ampliación de
FOOD_DB debe partir de esta lista, no de criterios técnicos genéricos.
Lista completa (categorías marcadas para revisión):

PROTEÍNAS ANIMALES:
Pechuga de pollo, Muslo de pollo deshuesado, Pechuga de pavo,
Carne picada de ternera magra, Solomillo de ternera, Lomo de cerdo,
Conejo, Huevos enteros, Claras de huevo pasteurizadas, Jamón serrano
o ibérico, Salmón fresco o ahumado, Atún fresco, Atún al natural en
conserva, Merluza, Bacalao, Sardinas frescas o en conserva, Caballa,
Dorada, Lubina, Gambas y langostinos, Pulpo, Calamares, Mejillones

LÁCTEOS:
Leche entera, Leche semidesnatada, Leche desnatada, Yogur natural
sin azúcares añadidos, Yogur griego natural, Queso fresco, Queso
batido 0% grasa, Queso Cottage, Queso tierno o curado, Kéfir

LEGUMBRES Y DERIVADOS:
Lentejas, Garbanzos, Alubias blancas o pintas, Guisantes, Soja
texturizada, Tofu firme, Tempeh, Edamame, Altramuces, Habas

CEREALES Y FÉCULAS:
Copos de avena, Harina de avena, Arroz blanco, Arroz integral, Pasta
de trigo, Pasta integral, Quinoa, Pan integral, Pan blanco, Patata,
Boniato o batata, Cuscús, Tortitas de arroz o maíz, Maíz dulce,
Trigo sarraceno, Yuca o tapioca

FRUTAS:
Plátano, Manzana, Pera, Naranja, Mandarina, Kiwi, Fresa, Arándanos,
Frambuesas, Uvas, Sandía, Melón, Piña, Mango, Papaya, Melocotón,
Ciruela, Cerezas, Granada, Higo, Aguacate, Dátiles, Uvas pasas,
Orejones, Coco fresco o rallado

VERDURAS Y HORTALIZAS:
Brócoli, Espinacas, Lechuga, Canónigos, Rúcula, Tomate, Cebolla,
Ajo, Zanahoria, Calabacín, Berenjena, Pimiento rojo, Pimiento verde,
Pimiento amarillo, Coliflor, Judías verdes, Espárragos verdes o
blancos, Champiñones y setas, Pepino, Apio, Puerro, Alcachofas,
Calabaza, Remolacha, Acelgas

FRUTOS SECOS Y SEMILLAS:
Nueces peladas, Almendras, Anacardos, Pistachos, Cacahuetes,
Avellanas, Nueces de Brasil, Semillas de chía, Semillas de lino,
Semillas de calabaza, Semillas de girasol, Semillas de sésamo, Crema
de cacahuete, Crema de almendras, Tahini

GRASAS Y CONDIMENTOS:
Aceite de oliva virgen extra, Aceite de coco, Mantequilla, Sal
marina o sal yodada, Pimienta negra, Cúrcuma, Canela, Cacao puro en
polvo desgrasado

BEBIDAS:
Agua mineral, Café, Té verde

DEPORTIVOS (revisar relevancia según perfil de pacientes):
Proteína de suero de leche, Caseína micelar, Creatina monohidrato,
Maltodextrina o Ciclodextrina, Geles deportivos de carbohidratos,
Bebida isotónica

Acción: cruzar con FOOD_DB actual (comando consola) para detectar
huecos reales antes de añadir. Tomar decisión sobre fuente de datos
(BEDCA web, USDA, etc.) y nivel de detalle de los suplementos
deportivos. NO arrancar 1.3 hasta cerrar BUG-001 y BUG-002.
Estado: pendiente, bloqueado por BUG-001 y BUG-002.

### TASK-005 — Limpiar inicialización de dt.targets.{prot,gras,ch} en JSON load
Detectado: durante el diagnóstico de BUG-001.
La carga inicial del JSON (líneas 4380-4383 de Procesador.html) escribe
dt.targets.{prot,gras,ch} con multiplicadores 1.8/0.9 g/kg (o 2.0/1.0
si el nombre del día contiene "entreno"/"entren"/"deport") sobre un
TDEE aproximado común. Tras el arreglo de BUG-001, nadie consume esas
claves para macros — exportarExcel ahora usa calcTargetMacrosFromGkg.
Pero su inicialización sigue ahí y puede confundir a futuros lectores
o consumidores accidentales.
Acción: verificar primero que ninguna otra parte del código consume
dt.targets.{prot,gras,ch}; eliminar la inicialización o reemplazarla
por un wrapper que llame a la lógica nueva.
Riesgo: bajo (deuda técnica, no funcional).
Estado: pendiente.

### TASK-006 — Unificar nomenclatura ch/gras ↔ carbs/fat (deuda técnica)
Detectado: durante el diagnóstico de BUG-002.
El código mantiene dual-write deliberado de cada food object con dos
pares de nombres para los mismos macros: ch/gras (usado por
calcOptionTotal, exportarExcel) y carbs/fat (usado por la versión
activa de calcSingleOptionTotal en línea 8076, y calcLiveMacros).
La nota interna del proyecto está en línea 7926. La duplicación es
fuente recurrente de bugs como BUG-002, donde una ruta de escritura
olvidó uno de los dos pares.
Acción: en una pieza dedicada, unificar a un solo par —probablemente
carbs/fat, por ser el que usan las funciones activas más recientes—,
migrar todas las lecturas y escrituras, y eliminar el dual-write.
Riesgo: medio. Toca zona crítica de cálculo de macros (la misma que
se estabilizó en BUG-001). Requiere su propio diagnóstico, plan y
commit aislado.
Estado: pendiente, prioridad MEDIA (deuda técnica activa que ya ha
producido al menos un bug — BUG-002).

---
Notación: cada entrada lleva su id (BUG-NNN o TASK-NNN), fecha o
referencia de detección, síntoma observable, hipótesis si la hay,
severidad y estado. Cerrar una entrada = mover a una sección
"## Cerrados" al final con su commit asociado.

## Cerrados

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
Estado: cerrado — commit c9e840f.

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
Estado: cerrado — commit 0ad3d2e.

### TASK-001 — Versionar PIECE-1-SPEC.md y PIECE-2-SPEC.md
Detectado: tras commit 5a1a5d1.
Los dos archivos de especificación de pieza estaban en la carpeta del
repo pero no versionados. Misma situación que el CLAUDE.md antes del
commit f1bf229.
Acción: git add ambos + commit "Versiona especificaciones de pieza".
Estado: cerrado — commit 4aefee6.
