# Multi Barbershop Architecture

Arquitectura recomendada para evolucionar de Spencer Barber Shop a una plataforma multi-barberia sin perder calidad ni control.

## Estrategia recomendada

Empieza con una sola barberia en produccion:

- Spencer Barber Shop
- un dominio
- un proyecto Firebase
- una configuracion clara

Despues evoluciona a multi-barberia con aislamiento logico por `tenantId`.

## Lo que no recomiendo

No recomiendo crear una sola app improvisada donde todas las barberias compartan datos sin una clave de aislamiento fuerte. Eso escala mal, complica permisos y abre riesgo de fuga de datos.

## Opcion A - Un proyecto Firebase por barberia

Ventajas:

- aislamiento total
- reglas mas simples
- deploy por cliente
- branding y dominio independientes

Desventajas:

- operacion mas pesada
- mas proyectos que administrar
- mas trabajo de soporte y monitoreo

Cuandola usar:

- cuando vendas la plataforma como instalacion premium por barberia
- cuando cada barberia pague setup y soporte separado

## Opcion B - Un proyecto Firebase multi-tenant con `tenantId`

Ventajas:

- una sola base operativa
- onboarding mas rapido
- mas facil crear panel super admin central
- menor costo de infraestructura inicial

Desventajas:

- reglas mas complejas
- consultas e indices mas exigentes
- mayor cuidado con seguridad

Cuandola usar:

- cuando tu objetivo es convertirlo en SaaS multi-barberia

## Mi recomendacion para ti

Fase comercial:

1. Spencer primero como piloto real.
2. Validar flujo de negocio y soporte.
3. Luego migrar a arquitectura multi-tenant con `tenantId`.

Eso te da velocidad sin construir una plataforma enorme antes de vender.

## Modelo de datos recomendado para multi-tenant

Todas las entidades deben incluir `tenantId`.

```txt
tenants/
  {tenantId}

users/
  {uid}

barbers/
  {barberId}

services/
  {serviceId}

queue/
  {queueId}

appointments/
  {appointmentId}

payments/
  {paymentId}
```

Ejemplo de `tenant`:

```json
{
  "id": "spencer-barber-shop",
  "name": "Spencer Barber Shop",
  "slug": "spencer-barber-shop",
  "domain": "app.spencerbarbershop.com",
  "themeColor": "#f59e0b",
  "active": true,
  "createdAt": 1762214400000
}
```

Ejemplo de usuario:

```json
{
  "id": "uid_123",
  "tenantId": "spencer-barber-shop",
  "name": "Spencer",
  "email": "spencer@spencerbarber.com",
  "role": "owner",
  "barberId": "barber_spencer",
  "active": true
}
```

## Identidad y acceso

Roles recomendados:

- `super_admin`
- `tenant_owner`
- `manager`
- `barber`
- `client`

El `super_admin` puede ver varias barberias.
Los demas usuarios solo deben poder leer y escribir dentro de su `tenantId`.

## Routing web recomendado

Dos caminos viables:

### Opcion 1 - Subdominios

- `app.spencerbarbershop.com`
- `app.otrocliente.com`

La app detecta el `hostname` y resuelve el `tenant`.

### Opcion 2 - Slug en ruta

- `tuapp.com/spencer-barber-shop`
- `tuapp.com/barberia-central`

Mas simple de lanzar, menos premium que subdominios.

## PWA por barberia

Para que cada barberia tenga sensacion de app propia necesitas:

- nombre dinamico
- `manifest.json` dinamico o build por tenant
- colores por tenant
- iconos por tenant
- dominio o ruta dedicada por tenant

Si buscas calidad premium, termina siendo mejor generar build o configuracion por tenant al publicar.

## Arquitectura de despliegue recomendada

Etapa 1:

- una sola barberia
- un hosting site

Etapa 2:

- varios hosting sites en Firebase Hosting
- o varios dominios apuntando a la misma app con resolucion por `tenant`

## Orden correcto de implementacion

1. Piloto Spencer con Firebase real.
2. Panel admin fuerte y flujos diarios reales.
3. Agregar `tenantId` a modelos.
4. Migrar reglas Firestore a aislamiento multi-tenant.
5. Resolver branding por hostname o slug.
6. Crear onboarding para nueva barberia.
7. Crear panel super admin central.

## Riesgos a vigilar

- reglas Firestore sin validar `tenantId`
- consultas sin indice compuesto
- manifest y branding estaticos
- login que no resuelva barberia actual
- pagos o citas visibles entre clientes distintos
