import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Modelo de palabra (ver especificación §4). Los campos de repaso espaciado
// (SM-2 simplificado) se inicializan al crear y se recalculan en la Fase 5.
export type Word = {
  id: string;
  term: string;
  definition: string;
  example: string;
  synonyms: string[];
  source?: string;
  createdAt: number;
  easeFactor: number;
  interval: number; // días hasta el próximo repaso
  dueDate: number; // timestamp (ms) del próximo repaso
  reviewsCount: number;
  lapses: number;
};

// Lo que la usuaria captura; el resto se rellena con valores por defecto.
export type WordInput = {
  term: string;
  definition?: string;
  example?: string;
  synonyms?: string[];
  source?: string;
};

const EASE_FACTOR_DEFAULT = 2.5;

function wordsCollection(uid: string) {
  return collection(db, 'users', uid, 'words');
}

// Inicio del día de hoy en ms (para que la palabra entre al repaso de hoy).
function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Una palabra está incompleta si aún no tiene definición (US-03). */
export function isIncomplete(word: Word): boolean {
  return word.definition.trim().length === 0;
}

/**
 * Suscripción en tiempo real a las palabras del usuario, ordenadas por fecha
 * de creación (más recientes primero). Devuelve la función para desuscribirse.
 */
export function subscribeWords(
  uid: string,
  onChange: (words: Word[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(wordsCollection(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const words = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Word);
      onChange(words);
    },
    (error) => onError?.(error),
  );
}

/** Crea una palabra con `dueDate = hoy` y los valores de repaso por defecto. */
export async function addWord(uid: string, input: WordInput): Promise<string> {
  const now = Date.now();
  const data: Omit<Word, 'id'> = {
    term: input.term.trim(),
    definition: input.definition?.trim() ?? '',
    example: input.example?.trim() ?? '',
    synonyms: input.synonyms ?? [],
    createdAt: now,
    easeFactor: EASE_FACTOR_DEFAULT,
    interval: 0,
    dueDate: startOfToday(),
    reviewsCount: 0,
    lapses: 0,
  };
  const source = input.source?.trim();
  if (source) data.source = source;

  const ref = await addDoc(wordsCollection(uid), data);
  return ref.id;
}

/** Actualiza campos editables de una palabra. */
export async function updateWord(
  uid: string,
  id: string,
  patch: Partial<WordInput>,
): Promise<void> {
  const clean: Record<string, unknown> = {};
  if (patch.term !== undefined) clean.term = patch.term.trim();
  if (patch.definition !== undefined) clean.definition = patch.definition.trim();
  if (patch.example !== undefined) clean.example = patch.example.trim();
  if (patch.synonyms !== undefined) clean.synonyms = patch.synonyms;
  if (patch.source !== undefined) clean.source = patch.source.trim();

  await updateDoc(doc(db, 'users', uid, 'words', id), clean);
}

/** Borra una palabra. */
export async function deleteWord(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'words', id));
}
