# Spencer Barber Shop App

Aplicación web y PWA privada para la operación de Spencer Barber Shop. El proyecto está orientado a un solo negocio, con roles, tickets por QR, citas, pagos y paneles operativos listos para evolucionar a producción con Firebase.

## Stack

- React 19
- TypeScript
- Vite
- Firebase Auth
- Cloud Firestore en tiempo real
- Firebase Storage preparado
- Firebase Hosting
- React Router DOM
- `qrcode`
- CSS propio responsive y mobile first

## Funcionalidades principales

- Autenticación por roles: cliente, invitado, barbero, dueño y superadministración.
- Tickets de atención por QR con código correlativo diario tipo `SB-YYYYMMDD-001`.
- Prevención de tickets duplicados por dispositivo, cliente o teléfono mientras exista un ticket activo.
- Seguimiento en tiempo real de posición, estado y espera estimada del ticket.
- Operación de cola para barbero y dueño: tomar siguiente, llamar, atender, finalizar, saltar y cancelar.
- Pantalla pública `/tv` para monitor interno de la barbería.
- Agenda de citas con horarios sugeridos según cola y disponibilidad.
- Pago por QR con envío de comprobante y validación manual.
- Servicios con imagen uniforme y estructura lista para Firebase Storage.
- Fallback local con `localStorage` para desarrollo si Firebase no está configurado.

## Instalación

```bash
npm install
```

## Variables de entorno

Copia `.env.example` a `.env` y completa tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Desarrollo

```bash
npm run dev
```

Si Firebase no está configurado, la app usará almacenamiento local como respaldo de desarrollo. En producción se recomienda usar siempre Firebase para autenticación, Firestore y Storage.

## Validación

```bash
npm run lint
npm run build
```

## Estructura Firestore recomendada

```txt
settings/
  business
  payment

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
```

## Deploy

```bash
npm run build
firebase deploy
```

## Documentación relacionada

- [HISTORY.md](./HISTORY.md)
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- [MULTI_BARBERSHOP_ARCHITECTURE.md](./MULTI_BARBERSHOP_ARCHITECTURE.md)
- [ROADMAP.md](./ROADMAP.md)
- [scripts/README.md](./scripts/README.md)

No publiques credenciales reales, cuentas de prueba ni secretos en este repositorio.
