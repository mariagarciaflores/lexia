import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from 'firebase/messaging';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { app, db } from './config';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

// El service worker de FCM se registra en un scope propio para no chocar con
// el service worker de la PWA (workbox, en "/"). La config (pública) se pasa
// por query params para no fijar valores del proyecto en el archivo del SW.
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope';

export type EnableResult = 'granted' | 'denied' | 'unsupported';

let messagingInstance: Messaging | null = null;

async function getMessagingIfSupported(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return null;
  if (!(await isSupported())) return null;
  if (!messagingInstance) messagingInstance = getMessaging(app);
  return messagingInstance;
}

/** ¿Este navegador soporta notificaciones push web? */
export async function notificationsSupported(): Promise<boolean> {
  return (await getMessagingIfSupported()) !== null;
}

function swConfigParams(): string {
  return new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  }).toString();
}

async function registerFcmSW(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${swConfigParams()}`,
    { scope: FCM_SW_SCOPE },
  );
}

function tokenDoc(uid: string, token: string) {
  return doc(db, 'users', uid, 'fcmTokens', token);
}

/**
 * Pide permiso, obtiene el token FCM y lo guarda en Firestore.
 * Devuelve si el permiso quedó concedido, denegado o no soportado.
 */
export async function enableNotifications(uid: string): Promise<EnableResult> {
  const messaging = await getMessagingIfSupported();
  if (!messaging || !VAPID_KEY) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const swReg = await registerFcmSW();
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });
  if (!token) return 'denied';

  await setDoc(tokenDoc(uid, token), {
    token,
    userAgent: navigator.userAgent,
    createdAt: serverTimestamp(),
  });
  return 'granted';
}

/** Borra el token de este dispositivo (al desactivar las notificaciones). */
export async function disableNotifications(uid: string): Promise<void> {
  const messaging = await getMessagingIfSupported();
  if (!messaging || !VAPID_KEY) return;
  try {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      await deleteDoc(tokenDoc(uid, token)).catch(() => {});
      await deleteToken(messaging).catch(() => {});
    }
  } catch {
    // Sin token previo: nada que borrar.
  }
}

/**
 * Muestra las notificaciones que llegan con la app abierta (primer plano).
 * Se llama una vez al cargar si el permiso ya está concedido.
 */
export async function initForegroundNotifications(): Promise<void> {
  const messaging = await getMessagingIfSupported();
  if (!messaging || Notification.permission !== 'granted') return;

  onMessage(messaging, (payload) => {
    const data = payload.data ?? {};
    const title = data.title || 'Lexia';
    const link = data.link || (data.wordId ? `/palabras?word=${data.wordId}` : '/');
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body: data.body,
        icon: '/pwa-192x192.png',
        data: { link },
      });
    });
  });
}
