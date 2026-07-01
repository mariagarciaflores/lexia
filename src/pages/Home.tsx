import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWords } from '../db/useWords';
import { isDue } from '../review/sm2';
import Icon from '../components/Icon';
import type { Word } from '../db/words';

export default function Home() {
  const { words, loading } = useWords();

  const dueCount = useMemo(() => words.filter((w) => isDue(w)).length, [words]);

  // Palabras "dominadas": ya repasadas y con intervalo de una semana o más.
  const masteredCount = useMemo(
    () => words.filter((w) => w.reviewsCount > 0 && w.interval >= 7).length,
    [words],
  );

  // 1–3 "palabras del día" al azar, estables durante todo el día.
  const wordsOfDay = useMemo(() => pickWordsOfDay(words, 3), [words]);

  return (
    <section className="screen home">
      <header className="home__head">
        <span className="home__eyebrow">{formatToday()}</span>
        <h1 className="home__title">Hoy</h1>
      </header>

      {loading ? (
        <p className="screen__text">Cargando…</p>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat">
              <span className="stat__icon stat__icon--magenta">
                <Icon name="sparkle" size={18} />
              </span>
              <span className="stat__body">
                <strong className="stat__num">{masteredCount}</strong>
                <span className="stat__label">dominadas</span>
              </span>
            </div>
            <div className="stat">
              <span className="stat__icon stat__icon--green">
                <Icon name="book" size={18} />
              </span>
              <span className="stat__body">
                <strong className="stat__num">{words.length}</strong>
                <span className="stat__label">palabras</span>
              </span>
            </div>
          </div>

          <div className="due-card">
            <div className="due-card__head">
              <span className="due-card__icon">
                <Icon name="review" size={17} />
              </span>
              <span className="due-card__label">Pendientes de repaso</span>
            </div>
            <div className="due-card__row">
              <span className="due-card__num">{dueCount}</span>
              <span className="due-card__text">
                {dueCount > 0
                  ? 'palabras listas para repasar hoy'
                  : words.length === 0
                    ? 'agrega tu primera palabra para empezar'
                    : 'nada pendiente, ¡buen trabajo!'}
              </span>
            </div>
            {dueCount > 0 ? (
              <Link to="/repasar" className="due-card__btn">
                Repasar ahora <Icon name="chevron-right" size={16} />
              </Link>
            ) : (
              words.length === 0 && (
                <Link to="/agregar" className="due-card__btn">
                  Agregar palabra <Icon name="plus" size={16} />
                </Link>
              )
            )}
          </div>

          {wordsOfDay.length > 0 && (
            <div className="wotd">
              <div className="wotd__head">
                <span className="wotd__spark">
                  <Icon name="sparkle" size={16} />
                </span>
                <span className="wotd__title">
                  Palabra{wordsOfDay.length > 1 ? 's' : ''} del día
                </span>
              </div>

              {wordsOfDay.map((w) => (
                <Link key={w.id} to="/palabras" className="wotd__card">
                  <div className="wotd__term-row">
                    <span className="wotd__term">{w.term}</span>
                    {w.synonyms.length > 0 && (
                      <span className="wotd__pos">{w.synonyms[0]}</span>
                    )}
                  </div>
                  {w.definition && <p className="wotd__def">{w.definition}</p>}
                  {w.example && (
                    <div className="wotd__example">
                      <p>“{w.example}”</p>
                    </div>
                  )}
                  {w.source && <span className="wotd__source">{w.source}</span>}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

// "Jueves 19 de junio" con la primera letra en mayúscula.
function formatToday(): string {
  const s = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
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
