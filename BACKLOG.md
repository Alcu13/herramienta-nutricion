# BACKLOG

Pila de bugs y mejoras detectadas durante el desarrollo, fuera del
alcance de la pieza en curso. Atacar cada una con su propio plan,
diagnóstico y commit, en el orden acordado con el mentor.

## Bugs

### BUG-005 — Solapamiento de marcadores en Gantt (comidas próximas <60 min)
Detectado: durante ensayo del PDF de 3.4a, día tipo Trabajo + Calistenia.
Síntoma: tres puntos de solapamiento visibles en pantalla y en PDF:
- Media mañana 12:00 + Almuerzo 12:00 (misma hora exacta).
- Almuerzo 12:00 + Pre-entreno 12:13 (13 min de separación).
- Post-entreno 22:45 + Cena 23:00 (15 min de separación).
Los marcadores se renderizan en su posición horaria exacta sin considerar el
ancho visual del bloque, por lo que comidas próximas (<60 min) se solapan en
pantalla y en PDF, pisando emojis y horas.
Estrategia decidida (mentor): apilado vertical automático tipo Google Calendar.
Umbral: 60 minutos. Dirección: hacia abajo (carriles crecientes).
Afecta: renderGanttForPDF (pieza 3.3) y, pendiente de revisar,
posiblemente también renderGanttForDT (planificador semanal).
Severidad: visual/estética. No falsea datos, pero degrada legibilidad del PDF
del paciente en días con comidas muy próximas.
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

### PIEZA 3 — PDF del paciente (rediseño visual)
Detectado: sesión de planificación 2026-05-28.
Reescritura del motor de PDF a HTML/CSS + overlay a pantalla completa para lograr un
documento visualmente rico orientado al paciente (Gantt de día tipo, tarjetas de comida
con opciones A/B/C, portada, iconos SVG). La implementación actual (generarPDF /
generarTodosPDF con jsPDF, líneas 5587-5806) se mantiene intacta y funcional hasta que
el nuevo motor esté completo y probado.
Mapa completo de sub-piezas (3.0 a 3.5) en PIECE-3-SPEC.md.
Estado: planificada, lista para arrancar por 3.0. Prioridad media (mejora de entregable;
no bloquea atención al primer paciente, que puede usar el PDF actual o el Excel).

### TASK-007 — Scraper BEDCA + integración en Biblioteca (pieza grande)
Detectado: discusión post-cierre de BUG-003/004.
La herramienta actualmente vive con FOOD_DB poblada a mano. Existe un
scraper en proyecto separado (scraper_alimentos_es.py, ver nota inicial
del CLAUDE.md) que actualmente recoge Open Food Facts y Mercadona a
SQLite. Para una herramienta clínica seria a medio plazo, conviene:
- Extender el scraper para incorporar BEDCA (Base de Datos Española de
  Composición de Alimentos), fuente oficial sin API pública (descarga
  del dataset).
- Decidir e implementar cómo se integran esos datos en Procesador.html:
  posiblemente como SQLite vía sql.js consultable desde la Biblioteca,
  con un buscador BEDCA similar al de Open Food Facts ya existente, y
  un botón "añadir a mi base" que escriba en FOOD_DB para mantener la
  coherencia con la arquitectura post-1.1 (FOOD_DB como fuente única
  del plan).
- Verificar end-to-end: buscar BEDCA → añadir a FOOD_DB → usar en
  plan → exportar a Excel.

Estimación realista: 2 a 4 sesiones de trabajo bien hecho, no horas.
Pospuesto explícitamente para después del primer paciente real. No
arrancar mientras haya pacientes activos sin un calendario que admita
varios días de trabajo en zona crítica.

Estado: pendiente, prioridad ALTA a medio plazo, BLOQUEADA hasta
después de validación con primer paciente real.

---
Notación: cada entrada lleva su id (BUG-NNN o TASK-NNN), fecha o
referencia de detección, síntoma observable, hipótesis si la hay,
severidad y estado. Cerrar una entrada = mover a una sección
"## Cerrados" al final con su commit asociado.

## Cerrados

### TASK-003 — Verificar en GitHub que los commits limpios no llevan Co-Authored-By
Detectado: sesión de verificación de coautoría, 2026-05-20.
Al primer push, comprobar en la interfaz web de GitHub que los commits
3fae597, 4aefee6 y 3d83752 no muestran coautoría en el cuerpo público.
Si alguno la llevara, enmendar antes de cerrar el push.
Estado: cerrado — verificado tras primer push (commit 73c5745).
Los commits 3fae597, 4aefee6 y 3d83752 verificados en la interfaz
web de GitHub: ninguno muestra línea Co-Authored-By en el cuerpo
público. La regla del no-coautor (commit 3fae597) ha funcionado
desde su grabación. Vercel reconstruyó el sitio público
automáticamente y la herramienta funciona en producción.

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
Estado: cerrado — sesión de 2026-05-22. El cribado por consola de
los 46 alimentos esenciales del perfil del primer paciente (omnívoro
mantenimiento) reveló que 44 ya estaban en FOOD_DB. Solo faltaban
'Crema de cacahuete' y 'Té verde', añadidos con datos BEDCA en
commit 098dc82. La lista de ~130 alimentos queda como referencia para
futuras incorporaciones según aparezcan nuevos pacientes; no se trata
de un objetivo de completitud.

### BUG-004 — Modificar gramos de un ingrediente de receta no actualiza el total
Detectado: pruebas post-BUG-002.
Síntoma: tras añadir una receta a una opción, cambiar los gramos de
cualquiera de sus ingredientes desde la interfaz NO recalcula el
total de la opción. Los alimentos manuales sí lo recalculan al
cambiar gramos.
Hipótesis preliminar (NO investigada aún): el handler de cambio de
gramos puede estar enganchado solo a alimentos manuales, no a
ingredientes provenientes de receta; o el evento se dispara pero no
recalcula los macros derivados del nuevo peso.
Severidad: clínica. El nutricionista ajusta gramos durante la
consulta y necesita ver el total actualizado en tiempo real.
Estado: cerrado como falso positivo — no reproducible en sesión
limpia tras commits c9e840f (BUG-002) y 0ad3d2e (BUG-001). Probable
arrastre de estado intermedio durante las pruebas post-fix de ayer.
No se modificó código.

### BUG-003 — Aceite de oliva no suma macros ni calorías
Detectado: pruebas post-BUG-002.
Síntoma: al añadir "aceite de oliva" como alimento manual en una
opción del plan, los macros y kcal de ese alimento no se suman al
total de la opción. Pendiente confirmar si ocurre con otros alimentos
o solo con aceite de oliva específicamente.
Hipótesis preliminar (NO investigada aún): el alimento puede no estar
en FOOD_DB con la grafía exacta, o existir pero con datos
nutricionales incompletos (kcal y macros faltantes), o tener algún
campo numérico almacenado como string que rompe la suma.
Severidad: clínica. Cualquier alimento que no suma falsea el total
de la opción.
Estado: cerrado como falso positivo — no reproducible en sesión
limpia tras commits c9e840f (BUG-002) y 0ad3d2e (BUG-001). Probable
arrastre de estado intermedio durante las pruebas post-fix de ayer.
No se modificó código.

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
