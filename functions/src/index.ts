import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';

initializeApp();
const db = getFirestore();

const WINDOW_MINUTES = 15;

type Word = {
  term: string;
  definition: string;
};

// Hora y fecha locales del usuario a partir de su zona IANA.
function localParts(now: Date, timeZone: string): { minutes: number; date: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour === '24' ? '00' : parts.hour);
  const minute = Number(parts.minute);
  return {
    minutes: hour * 60 + minute,
    date: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

// "08:00" -> 480 minutos.
function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// ¿La hora objetivo cae dentro del intervalo [ahora-15min, ahora]?
function withinWindow(localMinutes: number, targetMinutes: number): boolean {
  const diff = localMinutes - targetMinutes;
  return diff >= 0 && diff < WINDOW_MINUTES;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function pickWords(uid: string, count: number): Promise<Word[]> {
  const snap = await db.collection(`users/${uid}/words`).get();
  const playable = snap.docs
    .map((d) => d.data() as Word)
    .filter((w) => w.definition && w.definition.trim().length > 0);
  return shuffle(playable).slice(0, Math.max(1, Math.min(3, count)));
}

async function getTokens(uid: string): Promise<string[]> {
  const snap = await db.collection(`users/${uid}/fcmTokens`).get();
  return snap.docs.map((d) => d.id);
}

// Borra los tokens que FCM marca como inválidos/no registrados.
async function cleanInvalidTokens(
  uid: string,
  tokens: string[],
  responses: { success: boolean; error?: { code: string } }[],
): Promise<void> {
  const stale = ['messaging/registration-token-not-registered', 'messaging/invalid-argument'];
  await Promise.all(
    responses.map((res, i) => {
      if (!res.success && res.error && stale.includes(res.error.code)) {
        return db.doc(`users/${uid}/fcmTokens/${tokens[i]}`).delete().catch(() => undefined);
      }
      return undefined;
    }),
  );
}

/**
 * Cada 15 minutos: para cada usuario con notificaciones activas, si es su hora
 * local y no se le ha enviado hoy, manda la(s) palabra(s) del día (US-09).
 * Se envían mensajes "data-only"; el service worker arma la notificación.
 */
export const sendDailyWords = onSchedule(
  { schedule: 'every 15 minutes', timeZone: 'Etc/UTC', region: 'us-central1' },
  async () => {
    const now = new Date();
    const settingsSnap = await db
      .collectionGroup('settings')
      .where('notificationsEnabled', '==', true)
      .get();

    for (const docSnap of settingsSnap.docs) {
      const uid = docSnap.ref.parent.parent?.id;
      if (!uid) continue;

      const s = docSnap.data() as {
        notificationTime?: string;
        wordsPerNotification?: number;
        timezone?: string;
        lastNotifiedDate?: string;
      };
      const tz = s.timezone || 'Etc/UTC';
      const local = localParts(now, tz);

      if (!withinWindow(local.minutes, parseTime(s.notificationTime || '08:00'))) continue;
      if (s.lastNotifiedDate === local.date) continue; // ya se envió hoy

      const tokens = await getTokens(uid);
      if (tokens.length === 0) continue;

      const words = await pickWords(uid, s.wordsPerNotification ?? 1);
      if (words.length === 0) continue;

      const first = words[0];
      const single = words.length === 1;
      const message: MulticastMessage = {
        tokens,
        data: {
          title: single ? first.term : 'Tus palabras del día',
          body: single ? first.definition : words.map((w) => w.term).join(' · '),
          link: '/palabras',
        },
      };

      try {
        const res = await getMessaging().sendEachForMulticast(message);
        await cleanInvalidTokens(uid, tokens, res.responses);
        await docSnap.ref.update({ lastNotifiedDate: local.date });
        logger.info(`Notificación enviada a ${uid}: ${res.successCount}/${tokens.length}`);
      } catch (err) {
        logger.error(`Fallo al notificar a ${uid}`, err);
      }
    }
  },
);
