import { useState, type FormEvent } from 'react';
import type { Word, WordInput } from '../db/words';
import { WordNotFoundError, type DefinitionProvider } from '../providers';

type Props = {
  initial?: Partial<Word>;
  submitLabel: string;
  onSubmit: (input: WordInput) => Promise<void>;
  onCancel?: () => void;
  // Proveedor de definiciones (Fase 4). Si puede autocompletar, se muestra el
  // botón "Buscar definición".
  provider?: DefinitionProvider;
};

// Formulario de captura/edición de una palabra. Todos los campos son editables;
// solo el término es obligatorio (permite la "captura rápida" de US-03).
export default function WordForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  provider,
}: Props) {
  const [term, setTerm] = useState(initial?.term ?? '');
  const [definition, setDefinition] = useState(initial?.definition ?? '');
  const [example, setExample] = useState(initial?.example ?? '');
  const [synonyms, setSynonyms] = useState((initial?.synonyms ?? []).join(', '));
  const [source, setSource] = useState(initial?.source ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);

  const canLookup = provider?.canFetch ?? false;

  async function handleLookup() {
    if (!term.trim() || !provider) return;
    setLookupMsg(null);

    // El autocompletado requiere red (US-11): avisa si no hay.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setLookupMsg('Sin conexión: escribe la definición a mano.');
      return;
    }

    setLookingUp(true);
    try {
      const result = await provider.getDefinition(term);
      setDefinition(result.definition);
      setExample(result.example);
      setSynonyms(result.synonyms.join(', '));
      if (!result.example && result.synonyms.length === 0) {
        setLookupMsg(
          'Definición encontrada. Sin ejemplo ni sinónimos: complétalos a mano.',
        );
      }
    } catch (err) {
      if (err instanceof WordNotFoundError) {
        setLookupMsg('No se encontró esa palabra. Escribe la definición a mano.');
      } else {
        console.error(err);
        setLookupMsg(
          'No se pudo consultar el diccionario. Inténtalo de nuevo o escríbela a mano.',
        );
      }
    } finally {
      setLookingUp(false);
    }
  }

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

      {canLookup && (
        <div className="lookup">
          <button
            className="btn"
            type="button"
            onClick={handleLookup}
            disabled={lookingUp || !term.trim()}
          >
            {lookingUp ? 'Buscando…' : 'Buscar definición'}
          </button>
          {lookupMsg && <p className="lookup__msg">{lookupMsg}</p>}
        </div>
      )}

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
        <button
          className="btn btn--primary"
          type="submit"
          disabled={busy || !term.trim()}
        >
          {busy ? 'Guardando…' : submitLabel}
        </button>
        {onCancel && (
          <button
            className="btn btn--ghost"
            type="button"
            onClick={onCancel}
            disabled={busy}
          >
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
