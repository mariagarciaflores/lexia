import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useWords } from '../db/useWords';
import {
  makeQuestion,
  MIN_WORDS_TO_PLAY,
  playableWords,
  type Question,
} from '../game/quiz';

export default function Play() {
  const { words, loading } = useWords();
  const playable = useMemo(() => playableWords(words), [words]);

  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // Primera pregunta cuando ya hay palabras suficientes.
  useEffect(() => {
    if (!question && playable.length >= MIN_WORDS_TO_PLAY) {
      setQuestion(makeQuestion(playable));
    }
  }, [playable, question]);

  function handlePick(id: string) {
    if (selectedId || !question) return; // ya respondida
    setSelectedId(id);
    setScore((s) => ({
      correct: s.correct + (id === question.target.id ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function handleNext() {
    setSelectedId(null);
    setQuestion(makeQuestion(playable, question?.target.id));
  }

  if (loading) {
    return <Screen>Cargando…</Screen>;
  }

  if (playable.length < MIN_WORDS_TO_PLAY) {
    return (
      <Screen>
        <div className="empty">
          <p className="empty__text">
            Necesitas al menos {MIN_WORDS_TO_PLAY} palabras con definición para jugar.
            Llevas {playable.length}.
          </p>
          <Link to="/agregar" className="btn btn--primary">
            Agregar palabras
          </Link>
        </div>
      </Screen>
    );
  }

  if (!question) {
    return <Screen>Preparando el juego…</Screen>;
  }

  const answered = selectedId !== null;

  return (
    <section className="screen">
      <header className="screen__header screen__header--row">
        <h1 className="screen__title">Adivina la palabra</h1>
        <span className="score">
          {score.correct}/{score.total}
        </span>
      </header>

      <p className="screen__text">¿Qué palabra corresponde a esta definición?</p>
      <div className="quiz-def">{question.target.definition}</div>

      <ul className="quiz-options">
        {question.options.map((opt) => {
          const isCorrect = opt.id === question.target.id;
          const isPicked = opt.id === selectedId;
          let state = '';
          if (answered && isCorrect) state = ' quiz-option--correct';
          else if (answered && isPicked) state = ' quiz-option--wrong';
          return (
            <li key={opt.id}>
              <button
                className={'quiz-option' + state}
                onClick={() => handlePick(opt.id)}
                disabled={answered}
              >
                {opt.term}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div className="quiz-feedback">
          <p className={selectedId === question.target.id ? 'quiz-ok' : 'quiz-bad'}>
            {selectedId === question.target.id
              ? '¡Correcto! 🎉'
              : `Era: ${question.target.term}`}
          </p>
          <button className="btn btn--primary" onClick={handleNext}>
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return (
    <section className="screen">
      <header className="screen__header">
        <h1 className="screen__title">Jugar</h1>
      </header>
      {children}
    </section>
  );
}
