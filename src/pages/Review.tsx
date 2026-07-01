import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { useWords } from '../db/useWords';
import { saveReview } from '../db/words';
import { isDue, review, type Grade } from '../review/sm2';

const GRADES: { grade: Grade; label: string; className: string }[] = [
  { grade: 'again', label: 'No la sabía', className: 'btn--danger' },
  { grade: 'hard', label: 'Más o menos', className: '' },
  { grade: 'good', label: 'La sabía', className: 'btn--primary' },
];

export default function Review() {
  const { user } = useAuth();
  const { words, loading } = useWords();

  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ again: 0, hard: 0, good: 0 });
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);

  // Solo palabras pendientes hoy (US-06 CA1). La cola es estable durante la
  // sesión: las ya calificadas se excluyen aunque sigan venciendo (caso 'again').
  const due = useMemo(() => words.filter((w) => isDue(w)), [words]);
  const queue = due.filter((w) => !reviewed.has(w.id));
  const current = queue[0] ?? null;
  const totalReviewed = reviewed.size;

  // Vuelve a tapar la tarjeta al cambiar de palabra.
  useEffect(() => {
    setFlipped(false);
  }, [current?.id]);

  async function handleGrade(grade: Grade) {
    if (!user || !current || saving) return;
    setSaving(true);
    try {
      await saveReview(user.uid, current.id, review(current, grade));
      setStats((s) => ({ ...s, [grade]: s[grade] + 1 }));
      setReviewed((r) => new Set(r).add(current.id));
    } catch (err) {
      console.error('No se pudo guardar el repaso:', err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Screen>Cargando tu repaso…</Screen>;
  }

  // Nada pendiente al entrar.
  if (!current && totalReviewed === 0) {
    return (
      <Screen>
        <div className="empty">
          <p className="empty__text">
            ¡Sin pendientes! No hay palabras para repasar hoy.
          </p>
          <Link to="/agregar" className="btn btn--primary">
            Agregar palabras
          </Link>
        </div>
      </Screen>
    );
  }

  // Resumen al terminar (US-06 CA5).
  if (!current) {
    return (
      <Screen>
        <div className="summary">
          <h2 className="summary__title">¡Repaso terminado! 🎉</h2>
          <p className="summary__count">{totalReviewed} palabras repasadas</p>
          <ul className="summary__list">
            <li>
              La sabía: <strong>{stats.good}</strong>
            </li>
            <li>
              Más o menos: <strong>{stats.hard}</strong>
            </li>
            <li>
              No la sabía: <strong>{stats.again}</strong>
            </li>
          </ul>
          <Link to="/" className="btn btn--primary">
            Volver a Inicio
          </Link>
        </div>
      </Screen>
    );
  }

  const remaining = queue.length;

  return (
    <section className="screen">
      <header className="screen__header">
        <h1 className="screen__title">Repasar</h1>
        <p className="screen__text">
          {totalReviewed} hechas · {remaining} por repasar
        </p>
      </header>

      <button
        className="flashcard"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Ver la palabra' : 'Ver la definición'}
      >
        {!flipped ? (
          <span className="flashcard__term">{current.term}</span>
        ) : (
          <div className="flashcard__back">
            {current.definition ? (
              <p className="flashcard__def">{current.definition}</p>
            ) : (
              <p className="detail__empty">Sin definición.</p>
            )}
            {current.example && <p className="flashcard__example">“{current.example}”</p>}
          </div>
        )}
        <span className="flashcard__hint">
          {flipped ? 'Califica abajo' : 'Toca para voltear'}
        </span>
      </button>

      {flipped && (
        <div className="grade-row">
          {GRADES.map(({ grade, label, className }) => (
            <button
              key={grade}
              className={'btn ' + className}
              onClick={() => handleGrade(grade)}
              disabled={saving}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <section className="screen">
      <header className="screen__header">
        <h1 className="screen__title">Repasar</h1>
      </header>
      {children}
    </section>
  );
}
