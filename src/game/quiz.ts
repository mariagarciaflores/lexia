import type { Word } from '../db/words';

export const OPTIONS_PER_QUESTION = 4;
export const MIN_WORDS_TO_PLAY = OPTIONS_PER_QUESTION;

export type Question = {
  target: Word; // se muestra su definición
  options: Word[]; // términos a elegir (incluye al target), barajados
};

/** Solo se pueden usar palabras con definición (US-08 CA1). */
export function playableWords(words: Word[]): Word[] {
  return words.filter((w) => w.definition.trim().length > 0);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Construye una pregunta: una definición (target) y 4 términos a elegir
 * (1 correcto + 3 distractores), barajados. Evita repetir el target anterior
 * cuando hay suficientes palabras.
 */
export function makeQuestion(playable: Word[], previousId?: string): Question | null {
  if (playable.length < MIN_WORDS_TO_PLAY) return null;

  const candidates =
    previousId && playable.length > MIN_WORDS_TO_PLAY
      ? playable.filter((w) => w.id !== previousId)
      : playable;

  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const distractors = shuffle(playable.filter((w) => w.id !== target.id)).slice(
    0,
    OPTIONS_PER_QUESTION - 1,
  );

  return { target, options: shuffle([target, ...distractors]) };
}
