# PIECE-3-SPEC.md — Pieza 3: PDF del paciente (rediseño visual)

> Especificación para Claude Code. Estado: PLANIFICADA — lista para arrancar por 3.0.
> Lee CLAUDE.md antes. Solo se toca Procesador.html. La implementación actual de PDF
> (generarPDF / generarTodosPDF, líneas 5587-5806) NO se toca hasta que el nuevo motor
> esté completo y probado.

## 1. Contexto — qué existe hoy y por qué se rehace

Hoy el PDF del paciente lo genera `generarPDF` (y su hermano `generarTodosPDF`) mediante
**jsPDF programático**: coordenadas absolutas en puntos, texto dibujado línea a línea,
sin HTML ni CSS. Las funciones arrancan en la línea 5587 y terminan hacia la 5806.
Sus botones viven en la pestaña Exportar.

El resultado funciona pero tiene un techo visual bajo: no hay modo sencillo de añadir
Gantt de día tipo, tarjetas de comida con jerarquía visual, portada, ni iconos sin
reimplementar manualmente cada primitiva gráfica. jsPDF programático escala mal en
diseño rico.

**Enfoque elegido: HTML/CSS + overlay a pantalla completa → impresión a PDF.**
Se construye una vista HTML completa en un overlay que ocupa toda la pantalla; el usuario
lanza la impresión del navegador (Ctrl+P / Cmd+P) o se usa la API `window.print()`.
Ventajas: diseño con CSS estándar, Flexbox, Grid; SVG nativo para Gantt e iconos; sin
dependencias externas de terceros; sin el problema del div oculto (lección del CLAUDE.md:
`html2pdf` con contenido `display:none` produce PDFs en blanco).

**Riesgo conocido de `window.print()`:** el resultado depende de la configuración de
impresión del navegador del usuario, especialmente la opción "Gráficos de fondo"
(Background graphics) para los colores de fondo. La sub-pieza 3.0 debe validar este
punto explícitamente antes de invertir en diseño visual.

## 2. Principios de decisión (innegociables)

### 2.1 Enfoque técnico: HTML/CSS + overlay
El nuevo motor usa HTML/CSS renderizado en pantalla completa y `window.print()`.
**NO** jsPDF programático para lo nuevo. **NO** `html2pdf` con divs ocultos (lección
verificada del CLAUDE.md: produce PDF en blanco).

Riesgo conocido: los colores de fondo dependen de que el usuario tenga activada la
opción "Gráficos de fondo" en el diálogo de impresión del navegador. La sub-pieza 3.0
valida si esto es un bloqueante o una instrucción documentable antes de invertir en
el diseño de 3.1.

### 2.2 La implementación actual se mantiene intacta hasta que el nuevo motor esté probado
`generarPDF` y `generarTodosPDF` (líneas 5587-5806) y sus botones en la pestaña Exportar
**no se modifican ni se retiran** mientras el nuevo motor esté en desarrollo. Se trabaja
en paralelo: el nutricionista puede seguir exportando PDF con el motor viejo en todo
momento. El PDF antiguo solo se retira cuando el nuevo pase todos los tests de aceptación
de 3.1 y el nutricionista lo valide en un caso real.

### 2.3 Fotos reales de platos: fuera de alcance
Derechos de imagen, peso del archivo en el HTML inline, emparejamiento automático
inviable sin backend y coste de mantenimiento hacen esta opción inviable.
**Alternativa admitida:** iconos SVG minimalistas de categoría de alimento, momento del
día y medida casera (sin derechos, peso mínimo). Ver sub-pieza 3.4.

## 3. Sub-piezas

### 3.0 — Andamiaje del motor HTML/overlay
**Qué es:** infraestructura mínima que genera un PDF desde HTML/CSS usando overlay a
pantalla completa. Prueba de concepto: produce un PDF con el nombre del paciente y un
día tipo en texto simple, sin diseño elaborado.

**Objetivo real:** validar la tubería HTML→overlay→print de punta a punta antes de
invertir en diseño. Confirmar que `window.print()` con el overlay activo produce un PDF
real (no en blanco) en Chrome, Firefox y Safari/Edge. `generarPDF` vieja intacta y
accesible en paralelo.

**No produce nada bonito; produce certeza del camino técnico.**

Constriccciones:
- El overlay se inserta y se elimina del DOM limpiamente (sin residuos en el árbol).
- No rompe ninguna funcionalidad existente al activarse o cerrarse.
- Botón de prueba accesible solo en desarrollo (o en la pestaña Exportar con etiqueta
  clara "PDF nuevo — prueba"); no reemplaza el botón de PDF actual.

Test de aceptación:
1. Activar overlay → se cubre toda la pantalla.
2. `window.print()` → el diálogo de impresión abre con preview que muestra el nombre
   del paciente y al menos un día tipo en texto.
3. Guardar como PDF → el archivo resultante no está en blanco.
4. Cerrar overlay → la herramienta vuelve al estado normal sin errores de consola.
5. Los botones de `generarPDF` y `generarTodosPDF` originales siguen funcionando.
6. El PDF guardado conserva los colores de fondo de las tarjetas y secciones. Verificar
   el resultado con la opción "Gráficos de fondo" (Background graphics) tanto ACTIVADA
   como DESACTIVADA en el diálogo de impresión del navegador. Si los colores solo salen
   con la opción activada, documentarlo como instrucción necesaria al usuario en la
   página "cómo usar el plan" (sub-pieza 3.2), o evaluar un enfoque alternativo antes
   de invertir en el diseño de 3.1.

**Estado: TODOS LOS TESTS PASADOS** (verificado 2026-05-28).
`print-color-adjust: exact` funciona — colores conservados con "Gráficos de fondo"
tanto activado como desactivado. No se necesita instrucción al usuario en 3.2.

**Pendiente para 3.1/3.2:** el PDF generado con `window.print()` en Chrome incluye
cabecera y pie de página por defecto (fecha, título "Herramienta Nutricionista · Privado",
ruta `file:///...` y número de página). Deben ocultarse para el documento del paciente.
Solución: añadir `@page { margin: 0; }` en el bloque `@media print`, y gestionar
márgenes del contenido desde el propio HTML del overlay.

---

### 3.1 — Rediseño visual del plan (núcleo de valor)
**Qué es:** el PDF real orientado al paciente. Cada día tipo como sección; cada comida
con sus opciones A / B / C claramente separadas; cada opción con alimentos, gramos y
medida casera; horario recomendado de la ingesta.

**Al terminar 3.1 ya hay un PDF usable de verdad para entregar a un paciente.**

Constriccciones:
- **Sin macros en el documento del paciente.** P / CH / G / kcal son dato del
  nutricionista, no del cliente. No aparecen en ninguna parte del PDF de 3.1 en adelante.
- Medida casera visible junto a los gramos (ej. "80 g · 1 taza colmada").
- Opciones A / B / C con separación visual real (no solo letras): el paciente debe poder
  distinguirlas de un vistazo.
- Horario de ingesta encabezando cada bloque de comida.
- Construido sobre el andamiaje de 3.0; `generarPDF` vieja intacta.

Test de aceptación:
1. Generar PDF con el JSON de Sergio → se producen los 5 días tipo.
2. Cada comida muestra sus 3 opciones A/B/C visualmente separadas.
3. Ningún macro (P/CH/G/kcal) aparece en el documento.
4. Medidas caseras visibles en todas las opciones.
5. Horario visible en cada bloque de comida.
6. `generarPDF` original sigue operativa en paralelo.

---

### 3.2 — Portada + página "cómo usar el plan"
**Qué es:** dos páginas adicionales al inicio del documento.

Portada: nombre del paciente, objetivo en lenguaje llano (ej. "Mantener peso y mejorar
rendimiento deportivo"), fecha de elaboración y nombre del nutricionista.

Página de instrucciones (qué explicar):
- Qué es un día tipo y por qué hay varios.
- Cómo elegir entre la opción A, B o C de cada comida.
- Qué hacer si no entrena ese día (qué día tipo usar).
- Cómo sustituir un alimento si no está disponible o no apetece.
- Cómo contactar al nutricionista (campo configurable).
- Si 3.0 detectó que los colores requieren "Gráficos de fondo" activados: instrucción
  explícita al paciente sobre cómo activar esta opción al guardar el PDF.

---

### 3.3 — Mini Gantt por día tipo
**Qué es:** una línea de tiempo visual del día insertada al inicio de cada sección de
día tipo. Muestra las comidas y los bloques de entrenamiento a lo largo de un eje
horario.

**Reutiliza la lógica SVG del planificador semanal existente** en lugar de reimplementar
desde cero. Identificar la función o componente SVG que genera el Gantt actual y
adaptarla para el contexto del PDF.

---

### 3.4 — Iconografía
**Qué es:** iconos SVG minimalistas sin derechos para enriquecer el acabado visual.

Tipos de icono a considerar:
- Medidas caseras: taza, cuchara sopera, cuchara de postre, palma de mano, puño.
- Momento del día: sol amaneciendo (desayuno), sol alto (almuerzo/comida), luna (cena),
  media luna (recena).
- Categoría de alimento (opcional): cereal/grano, proteína animal, fruta, verdura,
  lácteo, grasa/fruto seco.

Sin derechos: producidos ad hoc como SVG inline o referenciados desde un sprite interno.
**Esta sub-pieza es acabado visual, no crítica para la usabilidad del plan.**

---

### 3.5 — Lista de la compra (opcional, futura)
**Qué es:** una página final con todos los alimentos del plan deduplicados y agrupados
por categoría (Proteínas, Cereales, Frutas, Verduras, Lácteos, Grasas y frutos secos…).

Fuera del alcance de la implementación inicial. Se evalúa cuando los días tipo estén
estabilizados y haya demanda real del nutricionista.

## 4. Orden de ejecución

```
3.0 → 3.1 → 3.2 → 3.3 → 3.4 → [3.5 opcional]
```

- **3.0** prueba el camino técnico. Sin ella no hay certeza de que el enfoque funciona,
  y valida el riesgo de "Gráficos de fondo" antes de invertir en diseño.
- **3.1** da el valor: al terminarlo hay un PDF entregable a un paciente real.
- **3.2, 3.3, 3.4** pulen y enriquecen. Pueden hacerse en cualquier orden tras 3.1.
- **3.5** es extra; se evalúa según demanda.

Si llega un paciente real antes de que 3.2-3.4 estén listos, el nutricionista puede
entregar el PDF de 3.1 o usar el PDF actual (jsPDF) sin interrupción.

## 5. Salvaguardas (recordatorio)

- Plan Mode siempre: plan → OK del mentor → implementar.
- Un sub-paso, un commit, diff mínimo.
- `generarPDF` y `generarTodosPDF` (líneas 5587-5806) intactas hasta retirada explícita
  aprobada por el mentor.
- Verificar carga de JSON real y funcionalidad de exportación existente tras cada sub-paso.
