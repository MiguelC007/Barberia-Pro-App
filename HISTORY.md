# History

Historial vivo de versiones y cambios del proyecto Spencer Barber Shop App.

Cada vez que se haga una tanda de cambios, agrega una entrada nueva arriba de la anterior. Usa versionado semantico:

- `MAJOR`: cambios incompatibles o migraciones grandes.
- `MINOR`: nuevas funciones o mejoras visibles.
- `PATCH`: correcciones pequenas, textos, estilos o ajustes internos.

## Plantilla para futuras entradas

```md
## vX.Y.Z - YYYY-MM-DD

### Agregado
- 

### Cambiado
- 

### Corregido
- 

### Validacion
- `npm run lint`
- `npm run build`
```

## v1.5.1 - 2026-07-05

### Agregado
- Hook `useLiveNow()` para refrescar tiempos visibles sin recargar la página.
- Helper `src/utils/tickets.ts` para presentar nombre y código de ticket de forma consistente y profesional.

### Cambiado
- Home, lista de espera, ticket público, panel de barbero y pantalla TV ahora recalculan tiempos en vivo.
- El código del ticket ahora aparece debajo del nombre del cliente y, si no hay nombre, la interfaz prioriza el código y la posición del turno.
- La pantalla `/tv` muestra ticket actual, barbero asignado, tiempo en servicio, próximos tickets y citas del día con lectura más clara desde lejos.
- Las tarjetas de servicios usan placeholder premium dinámico y proporciones uniformes.
- El lenguaje visible se ajustó hacia “lista de espera”, “orden de llegada”, “atención por turno” y “tiempo estimado en vivo”.

### Validación
- `npm run lint`
- `npm run build`

## v1.5.0 - 2026-07-05

### Agregado
- Pantalla pública en tiempo real en `/tv` y alias `/pantalla` para mostrar ticket actual, próximos tickets y citas del día.
- Soporte de imagen por servicio con `imageUrl` e `imageStoragePath`, además de placeholder visual profesional.
- Reglas de Storage y ampliación de reglas Firestore para tickets, pagos e imágenes.
- Sincronización híbrida Firebase + respaldo local para estado principal, con suscripciones en tiempo real.

### Cambiado
- Ticketera QR profesionalizada con correlativo diario `SB-YYYYMMDD-001`, control de duplicados por dispositivo/cliente y seguimiento en vivo.
- Operación de cola extendida para barbero/dueño: tomar siguiente, llamar, atender, finalizar, saltar o cancelar.
- Paneles de dueño, barbero, cliente, pagos, citas y superadministración con textos profesionales, tildes y permisos más claros.
- Servicios presentados con tarjetas visuales premium y panel administrativo listo para gestionar imágenes.
- README actualizado a instalación y despliegue profesional sin credenciales visibles.

### Corregido
- Se eliminaron textos visibles de demostración y mensajes de desarrollo en pantallas principales.
- Se corrigieron múltiples textos con acentos, ñ y redacción orientada a producción.

### Validación
- `npm run lint`
- `npm run build`

## v1.4.2 - 2026-07-05

### Agregado
- Nuevo archivo `src/styles/login-premium.css` para dar estilo premium y aislado a la pantalla de Login.
- Seccion comercial en Login para presentar beneficios: turnos por QR, citas inteligentes, pago por QR y PWA instalable.
- Tarjetas de acceso para cliente, barbero, dueno/admin y superadmin.

### Cambiado
- Login redisenado para que Spencer Barber Shop se vea como app privada profesional y no como pantalla demo/dev.
- Los accesos demo ya no aparecen visibles de entrada; quedan detras de un boton discreto para desarrollo o modo demo.
- README ya no muestra credenciales demo publicamente.
- Los formularios de staff y cliente ahora usan submit para permitir Enter sin romper AuthContext, roles ni rutas protegidas.

### Validacion
- Pendiente ejecutar en local: `npm run lint`
- Pendiente ejecutar en local: `npm run build`

## v1.4.1 - 2026-07-04

### Agregado
- Captura y adjuntos de foto, video o archivo para turnos, citas, chatbot y pago QR.
- Vista de referencias para turnos, citas y comprobantes dentro de los paneles operativos.

### Cambiado
- Login ahora mantiene una ruta de demo local util aunque Firebase ya este configurado.
- La tarjeta publica y las listas de turnos muestran mejor codigo de ticket, fuente y tiempos visibles.
- La vista principal y Turnos muestran espera aproximada con mejor consistencia para la demo.
- El login demo visible queda alineado al piloto inicial con Spencer como unico owner/barbero.

### Corregido
- El ticket manual ya no reutiliza por error el ticket QR activo del mismo navegador.
- El chatbot deja de repetir respuestas iguales y guarda referencias en turno o cita segun contexto.
- Pago QR acepta comprobante adjunto y el dueno puede verlo sin exponer edicion al cliente.

### Validacion
- `npm run lint`
- `npm run build`
- E2E Playwright: `/turno`, `/login`, `/fila`, `/citas`, `/chatbot`, `/pago`, `/dueno`

## v1.4.0 - 2026-07-05

### Agregado
- Ruta publica `/turno` para QR de entrada con ticket automatico por dispositivo.
- Generacion de tickets tipo `SB-YYYYMMDD-001-A7K` con correlativo diario.
- Modelo enriquecido de turnos con source, ticketCode, duracion estimada, posicion y timestamps operativos.
- `calculateQueueTimeline()` para posicion, tiempo esperando, tiempo estimado, hora sugerida y barbero sugerido.
- Ticket manual desde Turnos para barberos, dueno y super admin.
- Citas con horarios sugeridos segun turnos activos, barberos, servicios y citas existentes.
- Tarjeta visual de ticket para cliente QR y seguimiento mobile-first.

### Cambiado
- La UI visible reemplaza lenguaje tecnico de FIFO por Turnos y Lista de espera.
- Datos demo limpios para Spencer como dueno y unico barbero inicial.
- QR de entrada ahora apunta a `/turno` y no a la vista interna de turnos.
- Las citas validan choques contra agenda y espera proyectada.
- Fechas de ticket y citas iniciales usan fecha local para evitar saltos por UTC.

### Validacion
- `npm run lint`
- `npm run build`
- E2E Playwright: QR sin duplicar, ticket manual y cita desde horario sugerido.

## v1.3.1 - 2026-07-04

### Cambiado
- El seed automatico con Firebase Admin SDK ahora crea solo a Miguel y Spencer.
- Spencer queda como owner y unico barbero inicial del negocio.
- Se agregaron mensajes claros cuando faltan `scripts/seed.local.json` o `scripts/serviceAccountKey.json`.
- Se agrego `service_taper` y el placeholder `analytics/daily`.
- `README.md` y `FIREBASE_SETUP.md` ahora explican el flujo real con `npm run seed:firebase`.
- Se agrego `npm run debug:firestore` para diagnosticar lectura y escritura minima con Firebase Admin SDK.

### Validacion
- `npm run lint`
- `npm run build`

## v1.3.0 - 2026-07-04

### Agregado
- `scripts/seedFirebase.mjs` para sembrar Authentication y Firestore con Firebase Admin SDK.
- `scripts/seed.local.example.json` como plantilla de secretos locales para el seed.
- `scripts/README.md` con el flujo para descargar `serviceAccountKey.json`, llenar `seed.local.json` y ejecutar el seed.
- Script `npm run seed:firebase`.

### Cambiado
- `.gitignore` ahora protege `scripts/serviceAccountKey.json` y `scripts/seed.local.json`.

### Validacion
- `npm run lint`

## v1.2.0 - 2026-07-04

### Agregado
- `CREDENTIALS.local.md` como archivo local, ignorado por git, para guardar accesos confidenciales del super admin y del dueno.
- `FIREBASE_SETUP.md` con guia paso a paso para conectar la app a Firebase con enfoque profesional.
- `MULTI_BARBERSHOP_ARCHITECTURE.md` con estrategia recomendada para evolucionar de piloto single-tenant a plataforma multi-barberia.

### Cambiado
- `ROADMAP.md` ahora contempla la evolucion a multi-barberia por fases.
- `CREDENTIALS.md` ahora refleja el correo real recomendado del super admin y el doble rol de Spencer como dueno y barbero principal.

### Validacion
- `npm run lint`

## v1.1.1 - 2026-07-04

### Corregido
- Login no renderizaba por un loop de React en `useSyncExternalStore`.
- `localStore` ahora mantiene una cache estable de `AppState` para que `getSnapshot` devuelva la misma referencia cuando no hay cambios.

### Validacion
- `npm run lint`
- Prueba de login con Playwright en `http://localhost:5173/login`

## v1.1.0 - 2026-07-04

### Agregado
- Branding base para Spencer Barber Shop.
- `HISTORY.md` para registrar versiones y cambios.
- `ROADMAP.md` para planificar fases del producto.
- `CREDENTIALS.md` para credenciales demo y referencias operativas sin secretos reales.
- IDs mas seguros con `crypto.randomUUID`.
- Validaciones para fila, citas, pagos, barberos y servicios.
- Confirmacion y rechazo manual de pagos en panel de dueno.
- Boton PWA conectado al evento real de instalacion del navegador.
- Reglas Firestore mas estrictas para roles, validaciones y actualizaciones.

### Cambiado
- Login de staff usa Firebase Auth cuando hay `.env` configurado; mantiene demo local si no hay Firebase.
- Credenciales demo del dueno actualizadas para Spencer.
- Dependencias fijadas a versiones exactas.
- Service worker ajustado para fallback solo en navegacion.
- Claves de `localStorage` versionadas para Spencer Barber Shop.

### Corregido
- `npm run lint` fallaba por `baseUrl` deprecado en TypeScript 6.
- Import no usado en `ClientHome`.
- Pago demo ya no registra monto `0`.
- HTML, manifest y documentacion ya no muestran la barberia anterior.

### Validacion
- `npm run lint`
- `npx tsc -p tsconfig.app.json --noEmit --noUnusedLocals --noUnusedParameters`
- `npm run build`
- Servidor local verificado en `http://127.0.0.1:5174/`

## v1.0.0 - 2026-07-04

### Agregado
- Base inicial React + TypeScript + Vite.
- PWA con manifest y service worker.
- Login demo por roles.
- Cliente invitado.
- Fila FIFO.
- Citas.
- Chatbot basico de agenda.
- Pago QR manual.
- Panel de barbero.
- Panel de dueno/admin.
- Panel Super Admin.
- Preparacion inicial para Firebase Auth, Firestore y Hosting.
