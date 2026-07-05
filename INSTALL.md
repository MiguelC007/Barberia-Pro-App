# Guía de instalación paso a paso

## 1. Instalar Node.js

Descargá Node.js LTS desde el sitio oficial e instalalo.

Verificá en terminal:

```bash
node -v
npm -v
```

## 2. Abrir el proyecto

Extraé el ZIP y abrí la carpeta `barberia-pro-app` en Visual Studio Code.

## 3. Instalar dependencias

En la terminal de VS Code:

```bash
npm install
```

## 4. Crear archivo `.env`

Copiá `.env.example` y renombralo a `.env`.

Al inicio podés dejarlo vacío para modo demo.

## 5. Correr local

```bash
npm run dev
```

Abrí la URL que Vite te muestre, normalmente:

```txt
http://localhost:5173
```

## 6. Probar login demo

```txt
Super Admin: super@barberhn.com / 123456
Dueño/Admin: spencer@spencerbarber.com / 123456
Barbero: kevin@spencerbarber.com / 123456
```

También podés continuar como cliente invitado.

## 7. Crear Firebase Project

Entrá a Firebase Console y creá un proyecto nuevo.

Activá:

- Authentication
- Firestore Database
- Hosting

## 8. Copiar configuración Firebase

En la configuración web de Firebase, copiá las claves a `.env`.

## 9. Build

```bash
npm run build
```

## 10. Deploy

Instalá Firebase CLI si no lo tenés:

```bash
npm install -g firebase-tools
```

Login:

```bash
firebase login
```

Deploy:

```bash
firebase deploy
```

## Notas importantes

- Esta app es para una sola barbería.
- No muestra otras barberías.
- Para otra barbería, usá otra configuración, otro deploy y preferiblemente otro Firebase.
- No incluye IA real de rostro ni pagos reales todavía.
- El pago QR es manual.
- Firebase queda preparado para fase real.
