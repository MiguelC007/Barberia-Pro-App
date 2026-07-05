# Firebase Setup

Guia paso a paso para conectar Spencer Barber Shop App con Firebase de forma profesional.

Basado en la documentacion oficial de Firebase para:

- configuracion web del SDK: `firebase.google.com/docs/web/setup`
- autenticacion web: `firebase.google.com/docs/auth/web/start`
- password auth: `firebase.google.com/docs/auth/web/password-auth`
- Firestore quickstart: `firebase.google.com/docs/firestore/quickstart`
- Firebase Hosting quickstart: `firebase.google.com/docs/hosting/quickstart`
- dominios custom en Hosting: `firebase.google.com/docs/hosting/custom-domain`

## Objetivo

Primera etapa:

- lanzar Spencer Barber Shop como barberia piloto
- autenticar super admin y dueño
- usar Firestore real
- desplegar web y PWA

Segunda etapa:

- soportar varias barberias, cada una con su dominio, configuracion y datos aislados

## Paso 1 - Crear el proyecto Firebase de Spencer

1. Entra a Firebase Console con tu cuenta tecnica:
   `miguecarranzaavilez@gmail.com`
2. Crea un proyecto nuevo, por ejemplo:
   `spencer-barber-shop`
3. Activa Google Analytics solo si piensas usar analitica real desde el inicio.
4. Registra una app Web dentro del proyecto.
5. Copia la configuracion web que entrega Firebase.

## Paso 2 - Llenar el archivo `.env`

En este proyecto ya existe [`.env.example`](C:/Proyectos/barberia-pro-app/.env.example). Crea tu `.env` con:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Paso 3 - Activar Authentication

En Firebase Console:

1. Ve a `Authentication`.
2. En `Sign-in method`, activa `Email/Password`.
3. Guarda cambios.

## Paso 4 - Preparar el seed automatico

1. Descarga tu cuenta de servicio:
   `Firebase Console > Project Settings > Service Accounts > Generate new private key`
2. Guarda el archivo aqui:
   `scripts/serviceAccountKey.json`
3. Copia:
   `scripts/seed.local.example.json`
4. Pegalo como:
   `scripts/seed.local.json`
5. Completa las contraseñas privadas de:
   - Miguel
   - Spencer

## Paso 5 - Ejecutar el seed

```bash
npm run seed:firebase
```

Ese comando crea o reutiliza automaticamente:

- usuario Miguel como `super_admin`
- usuario Spencer como `owner`
- documento `users/{uid}` de ambos
- `settings/business`
- `settings/payment`
- `barbers/barber_spencer`
- servicios iniciales
- `analytics/daily`

No crea a Kevin por ahora. Spencer queda como unico dueño y unico barbero inicial del negocio.

## Paso 6 - Publicar reglas

Este proyecto ya incluye [firestore.rules](C:/Proyectos/barberia-pro-app/firestore.rules).

Publicalas con:

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules
```

## Paso 7 - Probar login real

Con `.env` listo:

1. Ejecuta:
   `npm run dev`
2. Entra con el super admin.
3. Verifica que ya no use modo demo y que la sesion venga de Firebase.

La app ya intenta usar Firebase Auth cuando detecta configuracion valida.

## Paso 8 - Hosting del piloto

Para lanzar la web de Spencer:

```bash
npm run build
firebase init hosting
firebase deploy
```

## Paso 9 - Dominio propio de Spencer

Cuando ya tengas dominio:

1. Ve a `Hosting` en Firebase Console.
2. Agrega dominio custom, por ejemplo:
   `app.spencerbarbershop.com`
3. Configura DNS segun el asistente de Firebase.
4. Espera la emision SSL.

## Paso 10 - PWA instalable

La app ya tiene `manifest` y `service-worker`.

Checklist:

- abrir desde HTTPS
- tener iconos correctos
- probar instalacion en Android
- probar instalacion en Chrome desktop

## Paso 11 - Cierre profesional del piloto

Antes de enseñarsela a Spencer:

- cargar logo real
- direccion real
- WhatsApp real
- horarios reales
- servicios reales
- datos bancarios reales
- un barbero principal real
- pruebas de login, fila, cita y pago

## Siguiente paso recomendado

No conectes aun varias barberias dentro de la misma base sin definir el modelo multi-tenant. Primero valida el piloto con Spencer. Despues pasamos a una arquitectura por `tenantId` o por `hosting site` segun tu estrategia comercial.
