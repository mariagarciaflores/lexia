import { useState } from 'react';
import WordForm from './WordForm';
import { deleteWord, isIncomplete, updateWord, type Word, type WordInput } from '../db/words';

type Props = {
  uid: string;
  word: Word;
  onClose: () => void;
};

// Detalle de una palabra en un modal. Permite ver, editar cualquier campo
// (US-05) y borrar con confirmación. Si está incompleta, abre directo en edición.
export default function WordDetail({ uid, word, onClose }: Props) {
  const [editing, setEditing] = useState(isIncomplete(word));
  const [deleting, setDeleting] = useState(false);

  async function handleSave(input: WordInput) {
    await updateWord(uid, word.id, input);
    setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm(`¿Borrar "${word.term}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeleting(true);
    try {
      await deleteWord(uid, word.id);
      onClose();
    } catch (err) {
      console.error('No se pudo borrar:', err);
      setDeleting(false);
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={word.term}>
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        {editing ? (
          <>
            <h2 className="modal__title">Editar palabra</h2>
            <WordForm
              initial={word}
              submitLabel="Guardar cambios"
              onSubmit={handleSave}
              onCancel={isIncomplete(word) ? onClose : () => setEditing(false)}
            />
          </>
        ) : (
          <>
            <h2 className="modal__title">{word.term}</h2>

            {word.definition ? (
              <p className="detail__definition">{word.definition}</p>
            ) : (
              <p className="detail__empty">Sin definición todavía.</p>
            )}

            {word.example && <p className="detail__example">“{word.example}”</p>}

            {word.synonyms.length > 0 && (
              <p className="detail__row">
                <strong>Sinónimos:</strong> {word.synonyms.join(', ')}
              </p>
            )}

            {word.source && (
              <p className="detail__row detail__source">{word.source}</p>
            )}

            <div className="word-form__actions">
              <button className="btn btn--primary" onClick={() => setEditing(true)}>
                Editar
              </button>
              <button
                className="btn btn--danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Borrando…' : 'Borrar'}
              </button>
            </div>
            <button className="btn btn--ghost" onClick={onClose}>
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
