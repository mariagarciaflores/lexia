import type { Word } from '../db/words';

// Repaso espaciado SM-2 simplificado (especificación §4, US-06).
// Tres calificaciones:
//   'again' = "No la sabía"  -> recae, vuelve hoy
//   'hard'  = "Más o menos"  -> avanza poco
//   'good'  = "La sabía"     -> avanza con el factor de facilidad
export type Grade = 'again' | 'hard' | 'good';

// Campos de repaso que se recalculan tras calificar.
export type ReviewState = Pick<
  Word,
  'easeFactor' | 'interval' | 'dueDate' | 'reviewsCount' | 'lapses'
>;

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** ¿La palabra está pendiente de repaso (dueDate <= hoy)? */
export function isDue(word: Word, now: number = Date.now()): boolean {
  return word.dueDate <= now;
}

/**
 * Calcula el nuevo estado de repaso a partir de la calificación.
 * Determinista: dado un Word + Grade + now, siempre devuelve lo mismo.
 */
export function review(
  word: Word,
  grade: Grade,
  now: number = Date.now(),
): ReviewState {
  let easeFactor = word.easeFactor;
  let interval = word.interval;
  let lapses = word.lapses;

  if (grade === 'again') {
    lapses += 1;
    easeFactor = Math.max(MIN_EASE, easeFactor - 0.2);
    interval = 0; // vuelve a estar pendiente hoy mismo
  } else {
    if (grade === 'hard') {
      easeFactor = Math.max(MIN_EASE, easeFactor - 0.15);
    } else {
      easeFactor = easeFactor + 0.1; // 'good'
    }

    if (word.reviewsCount === 0 || interval === 0) {
      interval = 1; // primer acierto: 1 día
    } else if (interval <= 1) {
      interval = grade === 'hard' ? 3 : 6; // segundo acierto
    } else {
      const factor = grade === 'hard' ? 1.2 : easeFactor;
      interval = Math.round(interval * factor);
    }
  }

  return {
    easeFactor,
    interval,
    dueDate: startOfDay(now) + interval * DAY_MS,
    reviewsCount: word.reviewsCount + 1,
    lapses,
  };
}
