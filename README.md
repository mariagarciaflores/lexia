# Lexia

PWA para coleccionar y memorizar el vocabulario nuevo que descubres al leer.
Construida con **React + TypeScript + Vite**, desplegada en **Firebase**.

> Estado: **Fase 7 — notificaciones + deploy**. Notificaciones push de la palabra del día con FCM + Cloud Functions (Cloud Scheduler), configurables en Ajustes (hora y cantidad), y despliegue en Firebase Hosting. App completa según la especificación. (Fases previas: 1 esqueleto, 2 auth, 3 datos, 4 diccionario, 5 repaso, 6 juego.)

## Autenticación (Fase 2)

Para que el login funcione en tu proyecto Firebase:

1. **Firebase Console → Authentication → Sign-in method**: habilita **Google** y **Correo electrónico/contraseña → Vínculo de correo electrónico (sin contraseña)**.
2. **Authentication → Settings → Dominios autorizados**: deja `localhost` y añade tu dominio de Hosting.
3. El enlace por correo vuelve a `/<origin>/login`; ese mismo `origin` debe estar entre los dominios autorizados.

## Requisitos

- Node.js 18+ (probado con Node 22)
- Una cuenta de Firebase (gratis)
- Firebase CLI para desplegar: `npm install -g firebase-tools`

## Configuración local

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Copia el archivo de variables y rellénalo con los datos de tu proyecto Firebase:
   ```bash
   cp .env.example .env
   ```
   Los valores salen de **Firebase Console → Configuración del proyecto → Tus apps → SDK**.
   > El archivo `.env` está en `.gitignore` y **nunca** debe subirse al repositorio.
3. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Scripts

| Comando           | Qué hace                                |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Servidor de desarrollo (Vite)           |
| `npm run build`   | Compila TypeScript y genera `dist/`     |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run deploy`  | Build + `firebase deploy`               |

## Despliegue en Firebase

1. Inicia sesión: `firebase login`
2. Pon tu Project ID en `.firebaserc` (reemplaza `TU_PROJECT_ID_DE_FIREBASE`).
3. Despliega Hosting + reglas:
   ```bash
   npm run deploy        # build + firebase deploy
   ```

## Notificaciones push (Fase 7)

La palabra del día llega por **FCM** y la envía una **Cloud Function programada**
(Cloud Scheduler) a la hora local de cada usuaria.

**Requisitos previos:**

1. **Plan Blaze** (Cloud Functions y Scheduler lo exigen): Console → _Uso y
   facturación_ → _Modificar plan_ → Blaze.
2. **Clave Web Push (VAPID):** Console → _Configuración del proyecto_ → _Cloud
   Messaging_ → _Web Push certificates_ → _Generar par de claves_. Cópiala en
   `.env` como `VITE_FIREBASE_VAPID_KEY` (es pública).

**Despliegue de las funciones:**

```bash
cd functions && npm install && cd ..
firebase deploy --only functions        # acepta habilitar las APIs que pida
# o todo junto:
npm run deploy && firebase deploy --only functions
```

- La función `sendDailyWords` corre cada 15 min y notifica a quien tenga la hora
  configurada en ese intervalo (sin repetir el mismo día).
- El service worker `public/firebase-messaging-sw.js` recibe el push en segundo
  plano; al tocar la notificación se abre el detalle de la palabra.
- En **iOS** las notificaciones requieren la PWA **instalada** y permiso concedido.

## Seguridad

- `firebaseConfig` se carga desde variables de entorno (`VITE_FIREBASE_*`).
- `.env` y cualquier credencial están en `.gitignore`.
- `firestore.rules` aísla los datos: cada usuario solo accede a `users/{uid}/**`.
- Restringe la API key por dominio en Google Cloud Console antes de publicar.

## Estructura

```
src/
  firebase/   Configuración de Firebase (Auth, Firestore, Messaging)
  auth/       Contexto de autenticación y rutas protegidas
  pages/      Una pantalla por sección
  components/ Componentes reutilizables (navegación, formularios, etc.)
  providers/  Proveedores de definiciones (diccionario / manual)
  db/         Acceso a datos / Firestore helpers (palabras, ajustes)
  review/     Repaso espaciado (SM-2 simplificado)
  game/       Lógica del mini-juego
functions/        Cloud Functions (notificación programada con FCM)
public/firebase-messaging-sw.js  Service worker de notificaciones
firestore.rules   Reglas de seguridad
firebase.json     Config de Hosting + Firestore + Functions
```
