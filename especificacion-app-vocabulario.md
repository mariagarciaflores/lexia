# Lexia — Especificación del proyecto y User Stories

> App de vocabulario para coleccionar palabras nuevas que descubres al leer, ver su significado y memorizarlas con repaso espaciado, notificaciones y un mini-juego.
> Documento para alimentar a un generador de código (Claude, Cursor, v0, etc.) y construir el proyecto por partes. Cópialo entero como contexto o pega bloque por bloque siguiendo las "Fases".

---

## 1. Visión

**Lexia** es una **PWA** que reemplaza al pizarrón físico de palabras: rápida de llenar, sin límite, y con repaso para que las palabras se queden. A diferencia de la primera versión, Lexia es **multiusuario y pública**: se publica en la web para que cualquiera la use, con su propia cuenta y su propio vocabulario.

- **Usuarios:** cualquiera puede registrarse; cada quien ve solo sus palabras.
- **Plataforma principal de repaso:** celular (instalable como PWA), también funciona en escritorio.

---

## 2. Stack técnico

- **Aplicación web / PWA** instalable, con repaso offline.
- **React + TypeScript**.
- **CSS** mobile-first (CSS Modules o CSS plano).
- **Vite** + `vite-plugin-pwa` (manifest + service worker).
- **Backend / Hosting:** **Firebase**
  - **Firebase Hosting** para el deploy.
  - **Firestore** para guardar las palabras de cada usuario.
  - **Firebase Authentication** para el login (Google + enlace por correo / *magic link*).
- **Definiciones automáticas:** **API de diccionario gratuita** (sin IA). Módulo intercambiable `DefinitionProvider`. Por defecto: `dictionaryapi.dev` en español.

> Decisiones respecto a la versión anterior: (1) sin IA — solo APIs de diccionario gratuitas; (2) datos en Firestore en la nube (no solo local); (3) login real multiusuario.

---

## 3. Definiciones — API de diccionario gratis (sin IA)

Módulo enchufable para no amarrarse a un solo diccionario:

```ts
interface DefinitionResult {
  definition: string;
  example: string;     // puede venir vacío según la fuente
  synonyms: string[];  // puede venir vacío según la fuente
}

interface DefinitionProvider {
  name: string;
  getDefinition(term: string): Promise<DefinitionResult>;
}
```

**Proveedor por defecto — Free Dictionary API** (`dictionaryapi.dev`):
- `GET https://api.dictionaryapi.dev/api/v2/entries/es/{term}`
- Gratis, sin API key, sin registro → **no hay secreto que proteger** en este punto.
- Mapear la primera acepción a `definition`; rellenar `example`/`synonyms` si vienen.
- Si la palabra no existe (404), avisar y permitir edición manual.

**Alternativas gratuitas a considerar** (por si una falla o no tiene español bueno): Wiktionary REST API, Wikcionario (es.wiktionary), Datamuse (para sinónimos: `https://api.datamuse.com/words?rel_syn=...`).

> Idea: combinar dos fuentes — definición desde Free Dictionary + sinónimos desde Datamuse — dentro de un mismo proveedor. Todo gratis y sin key.

**Proveedor manual:** la usuaria escribe todo a mano (útil para la frase del libro).

---

## 4. Modelo de datos (Firestore)

Estructura por usuario para aislar los datos:

```
users/{uid}                       // doc de perfil
users/{uid}/words/{wordId}        // subcolección con las palabras del usuario
```

```ts
type Word = {
  id: string;
  term: string;
  definition: string;
  example: string;
  synonyms: string[];
  source?: string;        // libro / autor (opcional)
  createdAt: number;
  // Repaso espaciado (SM-2 simplificado):
  easeFactor: number;     // arranca en 2.5
  interval: number;       // días al próximo repaso
  dueDate: number;        // timestamp del próximo repaso
  reviewsCount: number;
  lapses: number;
};

type UserSettings = {        // users/{uid} o users/{uid}/settings/app
  definitionProvider: 'dictionary' | 'manual';
  notificationsEnabled: boolean;
  notificationTime: string;    // "08:00"
  wordsPerNotification: number; // 1-3
};
```

- Mientras está offline, cachear con la **persistencia offline de Firestore** (built-in) para poder repasar sin red; sincroniza al reconectar.

---

## 5. Autenticación (login sencillo)

Dos métodos con Firebase Auth:

1. **Google** — botón "Continuar con Google" (`signInWithPopup` / `signInWithRedirect`).
2. **Enlace por correo (magic link / passwordless)** — el usuario escribe su correo, recibe un enlace, y al abrirlo entra sin contraseña (`sendSignInLinkToEmail` + `signInWithEmailLink`).

- Tras el primer login se crea `users/{uid}` si no existe.
- Pantalla de bienvenida/login antes de acceder al resto.

---

## 6. Seguridad (importante: repo público en GitHub)

> Objetivo: que **nada secreto** llegue al repositorio y que cada usuario solo pueda tocar sus datos.

1. **Config de Firebase ≠ secreto.** El objeto `firebaseConfig` (apiKey, projectId, etc.) es identificador público del proyecto, no una llave privada; puede ir en el front. **Aun así** lo cargamos desde variables de entorno (`import.meta.env.VITE_FIREBASE_*`) por orden y para separar entornos.
2. **`.env` fuera del repo.** Añadir `.env`, `.env.local`, `serviceAccount*.json` y credenciales al **`.gitignore`**. Incluir un `.env.example` con los nombres de variables pero **sin valores**.
3. **Nada de claves de servicio (Admin SDK)** en el front ni en el repo. Si hiciera falta lógica privilegiada, va en **Cloud Functions** con sus secretos en la config del servidor, nunca en el cliente.
4. **Reglas de seguridad de Firestore** = la verdadera protección de datos. Solo el dueño accede a lo suyo:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
5. **Restringir la API key de Firebase** en Google Cloud Console (por dominio HTTP referrer y por APIs permitidas) para evitar abuso.
6. **Dominios autorizados** en Firebase Auth (solo tu dominio de Hosting + localhost).
7. **Free Dictionary API**: sin key → nada que ocultar.

---

## 7. Pantallas (navegación inferior, estilo app móvil)

0. **Login / Bienvenida** — Google o enlace por correo.
1. **Inicio / Hoy** — "palabra(s) del día", conteo de pendientes y botón "Repasar ahora".
2. **Agregar** — escribir palabra → autocompleta desde el diccionario → revisar y guardar.
3. **Mis palabras** — lista buscable/filtrable; tocar para ver/editar.
4. **Repasar** — flashcards con repetición espaciada.
5. **Jugar** — mini-juegos.
6. **Ajustes** — proveedor de definiciones, notificaciones, hora, cerrar sesión.

---

## 8. User Stories (con criterios de aceptación)

### Épica 0 — Cuenta y acceso

**US-00 · Iniciar sesión sencillo**
Como usuaria quiero entrar con Google o con un enlace a mi correo, para usar la app sin crear contraseñas.
- CA1: Pantalla de login con "Continuar con Google" y campo de correo + "Enviarme enlace".
- CA2: Con Google entro en un toque; con correo recibo un enlace que me autentica al abrirlo.
- CA3: Al primer ingreso se crea mi perfil `users/{uid}`.
- CA4: Puedo cerrar sesión desde Ajustes.
- CA5: Solo veo mis propias palabras (aislamiento por `uid`).

### Épica A — Capturar palabras

**US-01 · Agregar palabra con autocompletado (diccionario gratis)**
Como lectora quiero escribir una palabra y que la app traiga su definición (y si hay, ejemplo y sinónimos) desde una API de diccionario gratuita, para no buscarla a mano.
- CA1: En "Agregar" hay campo de texto y botón "Buscar definición".
- CA2: Indicador de carga; luego se rellenan los campos (editables).
- CA3: Si la fuente no trae ejemplo/sinónimos, los dejo vacíos para llenar a mano.
- CA4: Si la palabra no existe o la API falla, aviso claro y edición manual.
- CA5: "Guardar" crea la palabra en Firestore (`dueDate = hoy`).

**US-02 · Editar antes de guardar**
Como usuaria quiero ajustar la definición o poner la frase del libro, para personalizar el aprendizaje.
- CA1: Todos los campos son editables; campo opcional "libro/autor".

**US-03 · Captura rápida**
Como lectora quiero guardar solo la palabra y completarla después, para no cortar la lectura.
- CA1: Puedo guardar con solo el término.
- CA2: Las incompletas se marcan en "Mis palabras" con botón "Completar".

### Épica B — Organizar

**US-04 · Ver mi lista** — Lista ordenable (fecha/alfabético), buscador, y detalle al tocar.

**US-05 · Editar o borrar** — Editar cualquier campo; borrar con confirmación.

### Épica C — Recordar (repaso espaciado)

**US-06 · Repaso con flashcards**
- CA1: Solo palabras con `dueDate <= hoy`.
- CA2: Veo la palabra; al tocar se voltea (definición + ejemplo).
- CA3: Califico "La sabía" / "Más o menos" / "No la sabía".
- CA4: Recalcula `interval`, `easeFactor`, `dueDate` (SM-2 simplificado).
- CA5: Resumen al terminar.

**US-07 · Pendientes de hoy en Inicio** — Conteo + botón "Repasar ahora" + 1–3 palabras del día al azar.

### Épica D — Practicar y notificaciones

**US-08 · Mini-juego "adivina la palabra"**
- CA1: Opción múltiple: una definición y 4 palabras de mi lista.
- CA2: Marca correcto/incorrecto y lleva puntaje.
- CA3: (Opcional) Modo "escribe una frase" usando la palabra.

**US-09 · Notificaciones de palabra del día**
- CA1: En Ajustes activo/desactivo, elijo hora y cantidad (1–3).
- CA2: A la hora llega notificación con término + definición.
- CA3: Tocarla abre el detalle de esa palabra.
- Nota técnica: PWA usa Service Worker + Notifications API; para notificaciones *push* reales con horario conviene FCM (Firebase Cloud Messaging). En iOS requieren PWA instalada y permisos.

### Épica E — PWA / plataforma

**US-10 · Instalar como app** — Manifest (nombre "Lexia", iconos, `display: standalone`) y prompt de instalación.

**US-11 · Funcionar offline** — App shell cacheada por el service worker; Firestore con persistencia offline; el autocompletado requiere red (aviso si no hay).

**US-12 · Elegir proveedor de definiciones** — En Ajustes: Diccionario gratis / Manual.

**US-13 · Mis datos son privados** — Reglas de Firestore impiden que un usuario lea o escriba palabras de otro.

---

## 9. Fases de construcción (orden sugerido para generar código)

1. **Fase 1 — Esqueleto + Firebase:** Vite + React + TS; conectar Firebase (config por `.env`); `.gitignore` + `.env.example`; PWA con `vite-plugin-pwa`; navegación inferior con pantallas vacías. (US-10)
2. **Fase 2 — Auth:** login Google + enlace por correo; rutas protegidas; crear `users/{uid}`; cerrar sesión. (US-00)
3. **Fase 3 — Datos:** modelo `Word`, CRUD en Firestore (subcolección por usuario), persistencia offline; "Mis palabras" + detalle. Reglas de seguridad. (US-04, US-05, US-11, US-13)
4. **Fase 4 — Agregar + diccionario:** módulo `DefinitionProvider` (Free Dictionary + Manual); pantalla "Agregar". (US-01, US-02, US-03, US-12)
5. **Fase 5 — Repaso:** SM-2 simplificado + flashcards; pendientes en Inicio. (US-06, US-07)
6. **Fase 6 — Juego:** opción múltiple. (US-08)
7. **Fase 7 — Notificaciones + Deploy:** notificaciones (Service Worker / FCM) y deploy en Firebase Hosting. (US-09)

---

## 10. Prompt listo para empezar (Fase 1)

> Pega esto a tu generador de código junto con las secciones 2, 4, 6 y 7:

```
Crea una PWA llamada "Lexia" con Vite + React + TypeScript, preparada para Firebase.
Requisitos:
- Integra Firebase (Auth, Firestore, Hosting). Carga el firebaseConfig desde variables de
  entorno VITE_FIREBASE_* (import.meta.env). NO pongas valores reales en el código.
- Crea .gitignore que excluya .env, .env.local y cualquier credencial; añade un .env.example
  con los nombres de variables sin valores.
- Configura vite-plugin-pwa: manifest (nombre "Lexia", display standalone, iconos placeholder)
  y service worker que cachee el app shell.
- Mobile-first. Navegación inferior con: Inicio, Agregar, Mis palabras, Repasar, Jugar, Ajustes,
  más una pantalla de Login. Usa React Router.
- Cada sección es por ahora un placeholder con su título.
- Estructura: /src/pages, /src/components, /src/firebase, /src/providers, /src/db.
- Incluye un archivo firestore.rules con reglas que permitan a cada usuario acceder solo a
  users/{uid}/** cuando request.auth.uid == uid.
Entrega el código completo, el .env.example y las instrucciones para correr en local y
para desplegar en Firebase Hosting.
```

Después seguimos con la Fase 2 (Auth) y la Fase 3 (Firestore) usando las secciones 4, 5 y 6.
