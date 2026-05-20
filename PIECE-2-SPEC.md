# PIECE-2-SPEC.md — Motor de sugerencias por reglas

> Especificación para Claude Code. Estado: BORRADOR.
> Lo marcado **[PENDIENTE: HTML]** se cierra cuando se aporte `estacion.html`.
> Lee CLAUDE.md antes. Esta pieza es solo el motor; NO se toca el scraper en su sesión.

## 0. Qué es y qué NO es

Es un **copiloto de decisión**, no un autopiloto. El motor propone; el nutricionista
acepta, cambia o regenera cada ingesta. NADA se confirma solo en el plan. Este requisito
es arquitectónico, no cosmético: no añadas ningún camino que escriba el plan sin acción
explícita del nutricionista.

El motor convierte datos que YA existen (JSON del paciente + objetivos por día tipo que ya
calcula la pestaña GET + biblioteca) en sugerencias de ingestas con su justificación. Es
**determinista**: misma entrada → misma salida. Sin IA, sin aleatoriedad sin semilla.

## 1. Forma del módulo (innegociable)

Una función pura, sin DOM, sin globals, testeable en aislamiento:

```
generarSugerencias(pacienteJSON, objetivosPorDiaTipo, consultarBiblioteca) -> Resultado
```

- `pacienteJSON`: el JSON v2.0 (ver contrato en CLAUDE.md).
- `objetivosPorDiaTipo`: lo que produce la pestaña GET por día tipo
  `{ kcal, proteina_g, grasa_g, hc_g }`.
- `consultarBiblioteca`: callback inyectado `(filtros) -> [alimentos]`; cada alimento con
  macros por 100 g, categoría, `origen`, y tags. El motor NO accede a sql.js directamente.
- Devuelve una estructura de datos (sección 6). NO toca el DOM.

Motivo doble: testeable sin navegador, y al ser un único módulo limpio invocado desde una
capa fina de integración, esquiva por diseño la trampa de hoisting (lección 1 del CLAUDE.md).

## 2. Etapa A — Clasificación de días tipo

De `actividades[]`, `semana{}` y `rutina{}` derivar el conjunto de días tipo distintos.
Firma de un día = conjunto ordenado de `(tipo, modalidad)` de sus actividades + bloque de
trabajo/estudio. Días con firma idéntica colapsan en el mismo día tipo.

Cada día tipo produce: etiqueta (Fuerza/Fútbol/Doble/Partido/Suave o nombre descriptivo
autogenerado), días que mapea, lista ordenada de ingestas con su `hora` (de
`semana[dia].comidas`), eventos de actividad con inicio/fin, y un nivel de carga derivado
(bajo / moderado / alto / muy alto) a partir de duración × intensidad estimada.

## 3. Etapa B — Rol y timing por ingesta (genera "el porqué")

Para cada ingesta, calcular minutos hasta el inicio del siguiente evento de entreno y desde
el fin del anterior, y la distancia a `habitos.horaAcostarse`. Asignar UN rol:

| Rol | Condición | Sesgo de macros | Plantilla de justificación (paciente, llano) |
|---|---|---|---|
| `carga-principal` | comida 3–5 h antes de la sesión principal del día | HC máximo del día | "Faltan ~{h} h para {actividad}: la comida más importante; aquí cargas la mayor parte de los hidratos." |
| `pre-entreno` | 90–180 min antes de entreno | HC fácil, grasa y fibra bajas, prot. moderada | "{m} min antes de {actividad}: energía rápida y poca grasa para llegar sin pesadez." |
| `post-entreno` | 0–60 min tras entreno | HC rápido + proteína, grasa baja | "Justo al acabar: hidratos rápidos y proteína para empezar a recuperar." |
| `puente` | sin entreno cerca, baja demanda | ligera, equilibrada | "Puente ligero hasta la siguiente comida fuerte." |
| `cierre` | última ingesta del día | ver regla de sueño ↓ | (depende de la distancia al sueño) |
| `base` | resto | equilibrada estándar | (sin nota especial) |

Reglas clínicas obligatorias:
- `carga-principal`: mayor cuota de HC; ubicada en la comida 3–5 h antes de la sesión más
  intensa del día. Una por día tipo como máximo.
- `pre-entreno` < 90 min: versión más ligera y de digestión más rápida.
- `post-entreno`: ventana ideal ≤ 60 min; penalizar grasa alta.
- Regla de sueño: si la última ingesta queda a < 2 h de `horaAcostarse` (cruzar con
  `habitos.suenoObs`, que puede indicar acostarse más tarde días de entreno), reducir
  grasa y volumen total, mantener proteína + HC moderado, y emitir nota:
  "Más ligera de lo que crees: te acuestas pronto; sin grasa pesada para no dificultar el sueño."
- Distribuir la proteína: ningún plato carga toda la diaria; objetivo orientativo
  ~0,3–0,4 g/kg por comida principal.
- Día tipo de carga baja (p. ej. Suave): bajar sesgo de HC global. NO recortar proteína.

La justificación es plantilla + valores rellenados (determinista, auditable). Texto SIEMPRE
en español llano, sin jerga: va tal cual al bloque `.why` del PDF del paciente.

## 4. Etapa C — Reparto de objetivos y scoring de alimentos

Repartir el objetivo diario del día tipo entre ingestas según pesos por rol (la
`carga-principal` se lleva la mayor cuota de HC; pre/post sus sesgos; etc.). Para cada
ingesta, consultar biblioteca y puntuar cada alimento/receta por:

1. Ajuste de macros a la sub-asignación de esa ingesta.
2. Idoneidad de rol (grasa/fibra alta penalizada en pre-entreno; HC rápido premiado en post).
3. Preferencias y disponibilidad: `alimentacion.alergias` = exclusión ABSOLUTA, tolerancia
   cero, sin bajar umbrales en silencio (disciplina lección 1/3 del CLAUDE.md);
   `alimentacion.noGusta` = excluir salvo override explícito del nutricionista; premiar
   `gustos` y `disponible`; respetar `tipoAlimentacion`.
4. Anclaje al hábito: premiar fuerte los platos/preparaciones que el paciente YA come
   (`comidasHabituales`). La adherencia manda: el motor debe reconocer y reutilizar sus
   comidas reales, no inventar de cero.
5. Variedad: penalizar repetición entre A/B/C de una misma ingesta y a lo largo del día,
   para que las tres opciones sean genuinamente distintas.
6. Preparación: respetar `comidasHabituales.extra` (p. ej. plancha/horno/airfryer): no
   proponer técnicas que el paciente no usa.

Selección: las 3 mejores combinaciones por ingesta, no solo los 3 mejores alimentos
sueltos (una combinación = alimentos que juntos cumplen la sub-asignación de la ingesta).

## 5. Salvaguardas

- Suelo de seguridad: el total diario sugerido NUNCA por debajo del mínimo prudente del
  CLAUDE.md, aunque el cálculo lo permita.
- Determinista y con semilla fija: reproducibilidad para defensa clínica.
- Sin DOM, sin estado global: módulo puro.
- Si la biblioteca no tiene candidatos suficientes para una ingesta, devolver la mejor
  aproximación + bandera `incompleto: true` con motivo, NUNCA rellenar con algo que rompa
  filtros duros.

## 6. Salida (a la vista del nutricionista)

Por día tipo → por ingesta → 3 combinaciones ranqueadas. Cada combinación:
- alimentos + cantidad en gramos (estación) y en medida casera (PDF paciente);
- totales de macros de la opción (visibles para el nutricionista, ocultos en PDF paciente);
- `justificacion`: string llano listo para el bloque `.why` del PDF;
- `ajuste`: indicador 0–1 de cuánto cuadra con el objetivo (señala dónde intervenir);
- banderas (`incompleto`, overrides aplicados…).

El nutricionista acepta / intercambia / regenera por ingesta. Sin auto-commit.

## 7. Integración — [PENDIENTE: HTML]

A cerrar al aportar `estacion.html`. Preguntas abiertas:
- ¿Qué función de la pestaña Plan se invoca y dónde viven hoy las opciones A/B/C en el DOM?
- ¿Cómo expone la biblioteca (sql.js + DB genérica interna) una query unificada para
  inyectar como `consultarBiblioteca`?
- ¿La pestaña GET ya expone `objetivosPorDiaTipo` en una estructura accesible o hay que
  extraerla? (No duplicar el cálculo: consumir lo que ya hay.)
- Capa de integración: thin, en el bloque de limpieza final, sin patrón de envoltura.
- ¿Riesgo de bloqueo de UI al recorrer la DB? Valorar Web Worker o troceado.

## 8. Test de aceptación (caso real Sergio)

Ejecutar sobre `datos_paciente_Sergio_Alcubilla_Ferrer.json`. El motor debe:
1. Producir exactamente 5 días tipo (Suave, Fuerza, Fútbol, Partido, Doble).
2. En Mar/Jue (Día Fútbol) ubicar la `carga-principal` en la Comida de las 16:00.
3. Marcar la Cena de las 23:00 con la nota de proximidad al sueño.
4. Sacar como opción top del desayuno su desayuno habitual real (tostadas integrales con
   jamón york, tomate y queso cottage + manzana): prueba del anclaje al hábito.
5. No proponer NUNCA pescado fresco (solo atún en lata / salmón ahumado).
6. Mismo input dos veces → salida idéntica.

No dar la pieza por terminada hasta que pasen los 6 puntos.
