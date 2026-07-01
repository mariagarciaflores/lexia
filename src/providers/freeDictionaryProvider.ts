import {
  WordNotFoundError,
  type DefinitionProvider,
  type DefinitionResult,
} from './types';

// Wikcionario en español (es.wiktionary.org): gratis, sin API key, sin registro
// y con CORS habilitado (origin=*). Devuelve definiciones monolingües en español
// — a diferencia de dictionaryapi.dev, que solo cubre inglés. (Especificación §3.)
const ENDPOINT = 'https://es.wiktionary.org/w/api.php';

// Líneas de metadatos que NO son la definición (sinónimos, ámbito, ejemplo, etc.).
const META = /^(Sinónimos?|Antónimos?|Hi(?:pó|per)\w+|Uso|Ámbito|Ejemplos?|Relacionados?|Derivados?|Véase):/i;
// Cabecera de acepción: "1", "4 Informática", "1 Mamíferos, perros".
const SENSE = /^\d+(?:\s+[^.]{0,40})?$/;

/** Divide "a (región), b (otra)" en ["a", "b"] respetando los paréntesis. */
function splitSynonyms(raw: string): string[] {
  return raw
    .replace(/\.$/, '')
    .split(/,\s*(?![^(]*\))/) // coma solo fuera de paréntesis
    .map((s) => s.replace(/\s*\(.*?\)\s*/g, '').trim()) // quita "(región)"
    .filter(Boolean);
}

/**
 * Extrae la primera acepción de la sección "== Español ==" del texto plano que
 * devuelve el Wikcionario. Devuelve null si no hay definición en español.
 */
function parseSpanishExtract(extract: string): DefinitionResult | null {
  const start = extract.search(/^==\s*Español\s*==/m);
  if (start === -1) return null;

  // Aísla la sección en español hasta el siguiente idioma de nivel 2 (== Otro ==).
  let block = extract.slice(start);
  const nextLang = block.slice(4).search(/\n==\s+[^=]/);
  if (nextLang !== -1) block = block.slice(0, nextLang + 4);

  const lines = block.split('\n').map((l) => l.trim());

  for (let i = 0; i < lines.length; i++) {
    if (!SENSE.test(lines[i])) continue;

    // La definición es la primera línea de contenido tras la cabecera de acepción.
    let definition = '';
    let j = i + 1;
    for (; j < lines.length; j++) {
      const l = lines[j];
      if (!l) continue;
      if (META.test(l) || SENSE.test(l) || l.startsWith('=')) {
        j = lines.length;
        break;
      }
      definition = l;
      break;
    }
    if (!definition) continue;

    // Sinónimos y ejemplo de esta misma acepción.
    let example = '';
    let synonyms: string[] = [];
    for (let k = j + 1; k < lines.length; k++) {
      const l = lines[k];
      if (SENSE.test(l) || l.startsWith('=')) break;
      const syn = l.match(/^Sinónimos?:\s*(.+)$/i);
      if (syn) synonyms = splitSynonyms(syn[1]);
      const ex = l.match(/^Ejemplos?:\s*(.+)$/i);
      if (ex && ex[1].trim() && !example) example = ex[1].trim();
    }

    return { definition, example, synonyms };
  }

  return null;
}

export const freeDictionaryProvider: DefinitionProvider = {
  id: 'dictionary',
  name: 'Diccionario gratis',
  canFetch: true,

  async getDefinition(term: string): Promise<DefinitionResult> {
    const title = encodeURIComponent(term.trim().toLowerCase());
    const url =
      `${ENDPOINT}?action=query&format=json&prop=extracts` +
      `&explaintext=1&redirects=1&origin=*&titles=${title}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`El diccionario respondió ${res.status}.`);

    const data = (await res.json()) as {
      query?: { pages?: Record<string, { missing?: string; extract?: string }> };
    };

    const page = Object.values(data.query?.pages ?? {})[0];
    if (!page || page.missing !== undefined || !page.extract) {
      throw new WordNotFoundError(term);
    }

    const result = parseSpanishExtract(page.extract);
    if (!result) throw new WordNotFoundError(term);

    return result;
  },
};
