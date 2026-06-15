import type { DefinitionProvider, DefinitionResult } from './types';

// Proveedor manual: la usuaria escribe todo a mano (útil para la frase del
// libro). No hace ninguna llamada; no ofrece autocompletado.
export const manualProvider: DefinitionProvider = {
  id: 'manual',
  name: 'Manual',
  canFetch: false,

  async getDefinition(): Promise<DefinitionResult> {
    return { definition: '', example: '', synonyms: [] };
  },
};
