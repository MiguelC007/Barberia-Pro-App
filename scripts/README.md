# Scripts README

## 1. Descargar `serviceAccountKey.json`

En Firebase Console:

1. Ve a `Project Settings`.
2. Abre la pestaña `Service Accounts`.
3. Haz clic en `Generate new private key`.
4. Descarga el archivo JSON y guardalo aqui:

`scripts/serviceAccountKey.json`

## 2. Crear `seed.local.json`

Usa el ejemplo de:

`scripts/seed.local.example.json`

Crea tu archivo real como:

`scripts/seed.local.json`

Ese archivo contiene las contraseñas privadas del super admin y del dueño. No se sube a GitHub.

## 3. Ejecutar el seed

Con el proyecto Firebase ya creado y los archivos locales listos:

```bash
npm run seed:firebase
```

El script va a:

- crear o reutilizar usuarios de Firebase Authentication
- crear o actualizar documentos en Firestore
- sembrar configuracion de negocio, pagos, barbero Spencer y servicios

## Archivos sensibles

Estos archivos son locales y estan ignorados por git:

- `scripts/serviceAccountKey.json`
- `scripts/seed.local.json`
