import { useState, type FormEvent, type ReactNode } from 'react';
import type { Word, WordInput } from '../db/words';

type Props = {
  initial?: Partial<Word>;
  submitLabel: string;
  onSubmit: (input: WordInput) => Promise<void>;
  onCancel?: () => void;
  // Contenido extra (p. ej. el botón "Buscar definición" en la Fase 4).
  extraActions?: ReactNode;
};

// Formulario de captura/edición de una palabra. Todos los campos son editables;
// solo el término es obligatorio (permite la "captura rápida" de US-03).
export default function WordForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  extraActions,
}: Props) {
  const [term, setTerm] = useState(initial?.term ?? '');
  const [definition, setDefinition] = useState(initial?.definition ?? '');
  const [example, setExample] = useState(initial?.example ?? '');
  const [synonyms, setSynonyms] = useState((initial?.synonyms ?? []).join(', '));
  const [source, setSource] = useState(initial?.source ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!term.trim()) return;
    setError(null);
    setBusy(true);
    try {
      await onSubmit({
        term,
        definition,
        example,
        synonyms: parseSynonyms(synonyms),
        source,
      });
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
      setBusy(false);
    }
  }

  return (
    <form className="word-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Palabra *</span>
        <input
          className="input"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="p. ej. efímero"
          autoFocus
          required
        />
      </label>

      {extraActions}

      <label className="field">
        <span className="field__label">Definición</span>
        <textarea
          className="input textarea"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="Significado de la palabra"
          rows={3}
        />
      </label>

      <label className="field">
        <span className="field__label">Ejemplo / frase del libro</span>
        <textarea
          className="input textarea"
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="Una frase donde aparece la palabra"
          rows={2}
        />
      </label>

      <label className="field">
        <span className="field__label">Sinónimos</span>
        <input
          className="input"
          value={synonyms}
          onChange={(e) => setSynonyms(e.target.value)}
          placeholder="separados por comas"
        />
      </label>

      <label className="field">
        <span className="field__label">Libro / autor (opcional)</span>
        <input
          className="input"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="p. ej. Rayuela — Cortázar"
        />
      </label>

      {error && (
        <p className="login__error" role="alert">
          {error}
        </p>
      )}

      <div className="word-form__actions">
        <button className="btn btn--primary" type="submit" disabled={busy || !term.trim()}>
          {busy ? 'Guardando…' : submitLabel}
        </button>
        {onCancel && (
          <button className="btn btn--ghost" type="button" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

// "uno, dos , ,tres" -> ["uno", "dos", "tres"]
function parseSynonyms(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
