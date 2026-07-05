# Spencer Barber Shop App

Aplicación web/PWA privada para la operación de Spencer Barber Shop. El sistema está pensado para una sola barbería, con roles controlados, tickets por QR, lista de espera, citas, pago por QR, pantalla pública y paneles operativos listos para evolucionar a producción con Firebase.

## Stack

- React 19
- TypeScript
- Vite
- Firebase Auth
- Cloud Firestore
- Firebase Storage preparado para la etapa final
- Firebase Hosting
- React Router DOM
- `qrcode`
- CSS propio responsive y mobile first

## Funciones principales

- Acceso por roles: cliente, barbero, dueño y superadministración.
- Tickets de atención por QR con correlativo diario tipo `SB-YYYYMMDD-001`.
- Lista de espera con posición, estado y tiempo estimado en vivo.
- Panel de barbero para disponibilidad, descanso, tomar siguiente, llamar, atender y finalizar.
- Panel de administración para branding, datos bancarios, servicios, barberos y pagos pendientes.
- Pantalla pública `/tv` y alias `/pantalla` para mostrar atención actual, próximos tickets y citas del día.
- Agenda de citas con horarios sugeridos según turnos activos, barberos y citas existentes.
- Pago por QR con comprobante y validación desde administración.
- Servicios con imágenes uniformes y estructura preparada para Firebase Storage.
- PWA instalable para uso en celular, tablet o escritorio.

## Instalación local

```bash
npm install
npm run dev
```

## Variables de entorno

Copia `.env.example` a `.env` y completa tus credenciales de Firebase cuando vayas a conectar la etapa final de producción:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

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

## Deploy futuro

```bash
npm run build
firebase deploy
```

Firebase será la etapa final para dejar Spencer Barber Shop App en producción con autenticación, Firestore, Storage y Hosting configurados correctamente.

## Documentación relacionada

- [HISTORY.md](./HISTORY.md)
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- [MULTI_BARBERSHOP_ARCHITECTURE.md](./MULTI_BARBERSHOP_ARCHITECTURE.md)
- [ROADMAP.md](./ROADMAP.md)
- [scripts/README.md](./scripts/README.md)

No publiques credenciales reales, accesos privados, cuentas bancarias completas ni secretos en este repositorio.
