import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useWords } from '../db/useWords';
import { isIncomplete, type Word } from '../db/words';
import WordDetail from '../components/WordDetail';

type SortKey = 'recientes' | 'alfabetico';

export default function MyWords() {
  const { user } = useAuth();
  const { words, loading, error } = useWords();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recientes');
  const [selected, setSelected] = useState<Word | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Si se llega con ?word=<id> (al tocar una notificación), abre ese detalle.
  const wordParam = searchParams.get('word');
  useEffect(() => {
    if (!wordParam || words.length === 0) return;
    const match = words.find((w) => w.id === wordParam);
    if (match) {
      setSelected(match);
      setSearchParams({}, { replace: true });
    }
  }, [wordParam, words, setSearchParams]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? words.filter(
          (w) =>
            w.term.toLowerCase().includes(q) ||
            w.definition.toLowerCase().includes(q),
        )
      : words;

    if (sort === 'alfabetico') {
      return [...filtered].sort((a, b) => a.term.localeCompare(b.term, 'es'));
    }
    return filtered; // ya vienen por createdAt desc desde Firestore
  }, [words, search, sort]);

  // Mantiene la palabra abierta sincronizada con los datos en vivo (tras editar).
  const openWord = selected
    ? (words.find((w) => w.id === selected.id) ?? null)
    : null;

  return (
    <section className="screen">
      <header className="screen__header screen__header--row">
        <h1 className="screen__title">Mis palabras</h1>
        <Link to="/agregar" className="btn btn--primary btn--compact">
          + Agregar
        </Link>
      </header>

      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}

      {!loading && words.length > 0 && (
        <div className="toolbar">
          <input
            className="input"
            type="search"
            placeholder="Buscar palabra o definición"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="toolbar__sort">
            <button
              className={'chip' + (sort === 'recientes' ? ' chip--active' : '')}
              onClick={() => setSort('recientes')}
            >
              Recientes
            </button>
            <button
              className={'chip' + (sort === 'alfabetico' ? ' chip--active' : '')}
              onClick={() => setSort('alfabetico')}
            >
              A–Z
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="screen__text">Cargando tus palabras…</p>
      ) : words.length === 0 ? (
        <div className="empty">
          <p className="empty__text">Aún no tienes palabras.</p>
          <Link to="/agregar" className="btn btn--primary">
            Agregar la primera
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <p className="screen__text">Ninguna palabra coincide con “{search}”.</p>
      ) : (
        <ul className="word-list">
          {visible.map((word) => (
            <li key={word.id}>
              <button className="word-item" onClick={() => setSelected(word)}>
                <span className="word-item__term">{word.term}</span>
                {isIncomplete(word) ? (
                  <span className="word-item__tag">Completar</span>
                ) : (
                  <span className="word-item__def">{word.definition}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {user && openWord && (
        <WordDetail uid={user.uid} word={openWord} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
