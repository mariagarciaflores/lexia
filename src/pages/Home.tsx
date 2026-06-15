import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWords } from '../db/useWords';
import { isDue } from '../review/sm2';
import type { Word } from '../db/words';

export default function Home() {
  const { words, loading } = useWords();

  const dueCount = useMemo(() => words.filter((w) => isDue(w)).length, [words]);

  // 1–3 "palabras del día" al azar, estables durante todo el día.
  const wordsOfDay = useMemo(() => pickWordsOfDay(words, 3), [words]);

  return (
    <section className="screen">
      <header className="screen__header">
        <h1 className="screen__title">Hoy</h1>
      </header>

      {loading ? (
        <p className="screen__text">Cargando…</p>
      ) : (
        <>
          <div className="card card--accent">
            <p className="card__label">Pendientes de repaso</p>
            <p className="home__count">{dueCount}</p>
            {dueCount > 0 ? (
              <Link to="/repasar" className="btn btn--primary">
                Repasar ahora
              </Link>
            ) : (
              <p className="card__sub">
                Nada pendiente hoy. {words.length === 0 && 'Agrega tu primera palabra.'}
              </p>
            )}
          </div>

          {wordsOfDay.length > 0 && (
            <>
              <h2 className="home__subtitle">Palabra{wordsOfDay.length > 1 ? 's' : ''} del día</h2>
              <ul className="word-list">
                {wordsOfDay.map((w) => (
                  <li key={w.id}>
                    <Link to="/palabras" className="word-item">
                      <span className="word-item__term">{w.term}</span>
                      {w.definition && <span className="word-item__def">{w.definition}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {words.length === 0 && (
            <div className="empty">
              <Link to="/agregar" className="btn btn--primary">
                Agregar la primera palabra
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// Selección determinista por día: misma fecha => mismas palabras.
function pickWordsOfDay(words: Word[], max: number): Word[] {
  if (words.length === 0) return [];
  const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return [...words]
    .map((w) => ({ w, key: hash(w.id + ':' + daySeed) }))
    .sort((a, b) => a.key - b.key)
    .slice(0, max)
    .map((x) => x.w);
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}
