import {
  WordNotFoundError,
  type DefinitionProvider,
  type DefinitionResult,
} from './types';

// Free Dictionary API (dictionaryapi.dev): gratis, sin API key, sin registro.
// No hay secreto que proteger en este punto (especificación §3 y §6.7).
const ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/es';

// Forma (parcial) de la respuesta de la API.
type ApiDefinition = {
  definition?: string;
  example?: string;
  synonyms?: string[];
};
type ApiMeaning = {
  definitions?: ApiDefinition[];
  synonyms?: string[];
};
type ApiEntry = {
  meanings?: ApiMeaning[];
};

export const freeDictionaryProvider: DefinitionProvider = {
  id: 'dictionary',
  name: 'Diccionario gratis',
  canFetch: true,

  async getDefinition(term: string): Promise<DefinitionResult> {
    const url = `${ENDPOINT}/${encodeURIComponent(term.trim().toLowerCase())}`;
    const res = await fetch(url);

    // 404 = la palabra no existe; cualquier otro error = problema de red/servicio.
    if (res.status === 404) throw new WordNotFoundError(term);
    if (!res.ok) throw new Error(`El diccionario respondió ${res.status}.`);

    const data = (await res.json()) as ApiEntry[];
    const meaning = data?.[0]?.meanings?.[0];
    const first = meaning?.definitions?.[0];
    if (!first?.definition) throw new WordNotFoundError(term);

    // Sinónimos: combina los de la acepción y los del significado, sin repetir.
    const synonyms = Array.from(
      new Set([...(first.synonyms ?? []), ...(meaning?.synonyms ?? [])]),
    );

    return {
      definition: first.definition,
      example: first.example ?? '',
      synonyms,
    };
  },
};
