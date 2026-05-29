Quiero integrar Firebase en mi aplicación local para persistir datos. 
Aquí está el contexto del proyecto:

[DESCRIBE TU APP AQUÍ: tecnología, estructura de carpetas, qué datos guarda ahora]

Por favor, sigue estos pasos en orden:

## Paso 1 – Análisis
- Lee el código actual y entiende cómo se manejan los datos hoy
- Identifica dónde se leen y escriben datos (state, localStorage, archivos, etc.)
- Lista los modelos de datos existentes

## Paso 2 – Configuración de Firebase
- Instala el SDK de Firebase: `npm install firebase`
- Crea el archivo `src/firebase.js` (o equivalente) con la configuración
- Usa variables de entorno (.env) para las credenciales, nunca hardcoded
- Decide si usar Firestore (documentos) o Realtime Database según el tipo de datos

## Paso 3 – Modelo de datos en Firestore
- Diseña la estructura de colecciones y documentos
- Muéstrame el esquema antes de implementar
- Propón reglas de seguridad básicas para Firebase

## Paso 4 – Migración de datos
- Reemplaza la lógica actual de almacenamiento por llamadas a Firebase
- Implementa las operaciones CRUD necesarias (create, read, update, delete)
- Mantén el código desacoplado con un archivo de servicios (ej: `services/db.js`)

## Paso 5 – Variables de entorno
- Crea `.env.local` con las claves de Firebase
- Actualiza `.gitignore` para excluir el .env
- Documenta en README qué variables hay que configurar

## Paso 6 – Testing
- Verifica que los datos se guardan y leen correctamente
- Comprueba que la app sigue funcionando igual que antes

Importante: 
- Trabaja paso a paso y pídeme confirmación antes de hacer cambios grandes
- Si algo no está claro, pregúntame antes de asumir
- Mantén compatibilidad con el código existente