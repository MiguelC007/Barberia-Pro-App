# Spencer Barber Shop App

Proyecto base para una plataforma web/PWA privada de una sola barberia.

Esta app no es marketplace. El cliente no ve otras barberias. Cada barberia debe tener su propia app, configuracion, datos, Firebase y deploy.

## Stack

- React
- TypeScript
- Vite
- Firebase preparado
- Firebase Auth preparado
- Firestore preparado
- Firebase Hosting preparado
- PWA con manifest y service worker
- React Router DOM
- QR con `qrcode`
- CSS propio moderno y responsivo

## Funciones incluidas

- Login por roles
- Cliente invitado
- Super Admin tecnico
- Dueno/Admin
- Barbero limitado
- Cliente
- Vista cliente
- Turnos de entrada con ticket unico
- QR publico en `/turno`
- Ticket automatico sin duplicar por dispositivo
- Ticket manual para clientes sin celular
- Timeline con posicion, espera y hora estimada
- Citas con disponibilidad segun turnos activos y agenda existente
- Chatbot basico para agendar
- Pago QR manual
- Panel de barbero
- Panel de dueno
- Panel Super Admin
- PWA instalable
- Modo demo/localStorage si Firebase no esta configurado

## Accesos de prueba

Por presentacion profesional, las credenciales demo ya no se muestran publicamente en el README ni en la pantalla inicial.

Para desarrollo local, los accesos de prueba deben mantenerse en `CREDENTIALS.md`, `CREDENTIALS.local.md` o en el seed local correspondiente. En la pantalla de Login, los accesos de prueba quedan ocultos detras de un boton discreto y solo deben usarse para validacion interna.

El cliente puede entrar con nombre y WhatsApp, continuar como invitado o escanear el QR publico para recibir ticket.

## Documentacion del proyecto

- [HISTORY.md](./HISTORY.md): historial de versiones y cambios.
- [ROADMAP.md](./ROADMAP.md): plan de fases para convertir la demo en producto operativo.
- [CREDENTIALS.md](./CREDENTIALS.md): credenciales demo y referencias de accesos.
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md): paso a paso para conectar Firebase en el piloto de Spencer.
- [MULTI_BARBERSHOP_ARCHITECTURE.md](./MULTI_BARBERSHOP_ARCHITECTURE.md): base arquitectonica para escalar a varias barberias.
- [scripts/README.md](./scripts/README.md): flujo del seed automatico para crear Auth + Firestore desde codigo.

Cada tanda de cambios debe cerrar con una entrada nueva en `HISTORY.md`.
No guardes secretos reales en `CREDENTIALS.md`; usa `.env` o `CREDENTIALS.local.md`.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Configuracion Firebase

Copia `.env.example` a `.env` y pega tus claves:

```bash
cp .env.example .env
```

Variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Si no configuras Firebase, la app funciona en modo demo con `localStorage`.

## Seed automatico Firebase

Para evitar crear usuarios y documentos a mano en Firebase Console:

```bash
npm run seed:firebase
```

Antes de ejecutarlo necesitas:

- `scripts/serviceAccountKey.json`
- `scripts/seed.local.json`

El seed crea o reutiliza:

- super admin Miguel
- owner Spencer
- `users/{uid}`
- `settings/business`
- `settings/payment`
- `barbers/barber_spencer`
- servicios iniciales
- `analytics/daily`

Spencer queda como dueno y unico barbero inicial del negocio.

## Estructura de datos sugerida en Firestore

```txt
settings/
  business
  payment
  theme

users/
  userId

barbers/
  barberId

services/
  serviceId

queue/
  ticketId

appointments/
  appointmentId

payments/
  paymentId

analytics/
  daily
```

## Deploy Firebase Hosting

```bash
npm run build
firebase login
firebase init hosting
firebase deploy
```

El archivo `firebase.json` ya esta preparado para publicar `dist`.
