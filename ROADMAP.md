# Roadmap

Plan de evolucion para convertir Spencer Barber Shop App de demo vendible a producto listo para operar y luego escalar a una plataforma multi-barberia.

## Fase 1 - Demo vendible

Estado: completada.

- Branding de Spencer Barber Shop.
- Modo demo con `localStorage`.
- Login por roles.
- Turnos de entrada.
- Citas.
- Pago QR manual.
- Paneles de cliente, barbero, dueno y super admin.
- Historial, roadmap y credenciales documentadas.
- Build local validado.

## Fase 2 - Operacion realista local

Estado: completada en modo demo/localStorage.

- Lenguaje de cliente basado en Turnos y Lista de espera.
- QR publico en `/turno`.
- Ticket automatico sin duplicar por dispositivo.
- Ticket manual para clientes sin celular.
- Correlativo diario y codigo unico de ticket.
- Timeline con posicion, espera, hora estimada y barbero sugerido.
- Citas con horarios sugeridos segun turnos activos y agenda existente.
- Datos demo alineados a Spencer como dueno y barbero inicial.

## Fase 3 - Firebase real

Prioridad: alta.

- Crear proyecto Firebase exclusivo para Spencer Barber Shop.
- Activar Firebase Auth con correo/contrasena.
- Crear usuarios reales:
  - Super Admin tecnico.
  - Dueno/Admin.
  - Barberos.
- Crear documentos `users/{uid}` con rol y `barberId`.
- Migrar servicios de `localStorage` a Firestore:
  - `settings`
  - `barbers`
  - `services`
  - `queue`
  - `appointments`
  - `payments`
- Probar reglas Firestore con emulador.
- Crear indices Firestore cuando aparezcan consultas compuestas.
- Cargar usuarios reales de Spencer.
- Publicar el primer dominio y PWA del piloto.

## Fase 4 - Operacion diaria

Prioridad: alta.

- Cola en tiempo real entre varios dispositivos.
- Persistir tickets QR, manuales y citas en Firestore.
- Sincronizar timeline entre recepcion, barbero y cliente.
- Estados de cita:
  - confirmada
  - checked in
  - en atencion
  - completada
  - cancelada
  - no asistio
- Historial de pagos por cliente.
- Confirmacion de pagos con usuario responsable.
- Reporte diario de atendidos e ingresos.

## Fase 5 - Producto comercial

Prioridad: media.

- Definir estrategia multi-barberia:
  - proyecto por barberia
  - o multi-tenant con `tenantId`
- Panel de configuracion inicial para instalar una barberia nueva.
- Exportacion de datos en CSV.
- Respaldo/restauracion de datos.
- Control de permisos mas granular.
- Mejoras responsive para tablets en recepcion.
- Code splitting para bajar tamano del bundle principal.
- Tests unitarios para servicios criticos.
- Tests e2e de login, fila, cita y pago.
- Resolver branding por barberia:
  - nombre
  - dominio
  - colores
  - manifest
  - iconos
  - datos de pago

## Fase 6 - Multi-barberia real

Prioridad: alta despues del piloto.

- Introducir `tenantId` en todas las entidades de negocio.
- Aislar reglas Firestore por barberia.
- Resolver barberia por dominio o slug.
- Permitir varias barberias en una sola plataforma central.
- Crear panel super admin para:
  - alta de barberia
  - activacion o suspension
  - soporte tecnico
  - auditoria
- Despliegue por dominio o subdominio de cada barberia.

## Fase 7 - Diferenciadores

Prioridad: media/baja.

- Recordatorios por WhatsApp.
- Chatbot con IA real para agenda.
- Recomendaciones de corte por preferencias.
- Galeria de estilos de Spencer Barber Shop.
- Programa de clientes frecuentes.
- QR de check-in por cita.
- Dashboard mensual para el dueno.

## Pendientes tecnicos

- Inicializar git y usar commits por version.
- Mantener `HISTORY.md` al cierre de cada tanda de cambios.
- No guardar secretos reales en archivos versionados.
- Crear `.env` local para Firebase real.
- Crear `CREDENTIALS.local.md` solo en la maquina del dueno/tecnico si se necesitan credenciales privadas.
- Mantener una guia de arquitectura multi-barberia antes de tocar datos productivos.
