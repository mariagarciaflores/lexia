import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { ProviderId } from '../providers/types';

// Ajustes del usuario (especificación §4). Las notificaciones se usan en la
// Fase 7; aquí ya viven sus campos con valores por defecto.
export type UserSettings = {
  definitionProvider: ProviderId;
  notificationsEnabled: boolean;
  notificationTime: string; // "08:00"
  wordsPerNotification: number; // 1-3
  timezone?: string; // IANA, p. ej. "America/Mexico_City" (para enviar a la hora local)
  lastNotifiedDate?: string; // YYYY-MM-DD; lo escribe la Cloud Function (anti-duplicados)
};

export const DEFAULT_SETTINGS: UserSettings = {
  definitionProvider: 'dictionary',
  notificationsEnabled: false,
  notificationTime: '08:00',
  wordsPerNotification: 1,
};

function settingsDoc(uid: string) {
  return doc(db, 'users', uid, 'settings', 'app');
}

/** Suscripción a los ajustes; si aún no existen, entrega los valores por defecto. */
export function subscribeSettings(
  uid: string,
  onChange: (settings: UserSettings) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    settingsDoc(uid),
    (snap) => {
      onChange(
        snap.exists()
          ? { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<UserSettings>) }
          : DEFAULT_SETTINGS,
      );
    },
    (error) => onError?.(error),
  );
}

/** Actualiza (merge) los ajustes del usuario. */
export async function updateSettings(
  uid: string,
  patch: Partial<UserSettings>,
): Promise<void> {
  await setDoc(settingsDoc(uid), patch, { merge: true });
}
