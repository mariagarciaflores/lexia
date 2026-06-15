# Lexia

PWA para coleccionar y memorizar el vocabulario nuevo que descubres al leer.
Construida con **React + TypeScript + Vite**, desplegada en **Firebase**.

> Estado: **Fase 1 — esqueleto del proyecto**. Navegación, PWA y la base de Firebase/seguridad están listas; el resto de las funciones se implementa en las fases siguientes (ver `especificacion-app-vocabulario.md`).

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

| Comando           | Qué hace                                  |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Servidor de desarrollo (Vite)             |
| `npm run build`   | Compila TypeScript y genera `dist/`       |
| `npm run preview` | Sirve el build de producción localmente   |
| `npm run deploy`  | Build + `firebase deploy`                 |

## Despliegue en Firebase

1. Inicia sesión: `firebase login`
2. Pon tu Project ID en `.firebaserc` (reemplaza `TU_PROJECT_ID_DE_FIREBASE`).
3. Despliega:
   ```bash
   npm run deploy
   ```

## Seguridad

- `firebaseConfig` se carga desde variables de entorno (`VITE_FIREBASE_*`).
- `.env` y cualquier credencial están en `.gitignore`.
- `firestore.rules` aísla los datos: cada usuario solo accede a `users/{uid}/**`.
- Restringe la API key por dominio en Google Cloud Console antes de publicar.

## Estructura

```
src/
  firebase/   Configuración de Firebase (Auth, Firestore)
  pages/      Una pantalla por sección
  components/ Componentes reutilizables (navegación, etc.)
  providers/  Proveedores de definiciones (Fase 4)
  db/         Acceso a datos / Firestore helpers (Fase 3)
firestore.rules  Reglas de seguridad
firebase.json    Config de Hosting + Firestore
```
