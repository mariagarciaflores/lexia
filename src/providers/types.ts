// Módulo enchufable de definiciones (especificación §3). Permite cambiar de
// fuente sin tocar la UI: hoy "Free Dictionary" gratis, mañana otra.

export type ProviderId = 'dictionary' | 'manual';

export interface DefinitionResult {
  definition: string;
  example: string; // puede venir vacío según la fuente
  synonyms: string[]; // puede venir vacío según la fuente
}

export interface DefinitionProvider {
  id: ProviderId;
  name: string;
  // ¿Puede traer definiciones automáticamente? (Manual = false).
  canFetch: boolean;
  getDefinition(term: string): Promise<DefinitionResult>;
}

// Error específico para "la palabra no existe en el diccionario" (US-01 CA4),
// distinto de un fallo de red.
export class WordNotFoundError extends Error {
  constructor(term: string) {
    super(`No se encontró "${term}" en el diccionario.`);
    this.name = 'WordNotFoundError';
  }
}
