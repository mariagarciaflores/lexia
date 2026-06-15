import { freeDictionaryProvider } from './freeDictionaryProvider';
import { manualProvider } from './manualProvider';
import type { DefinitionProvider, ProviderId } from './types';

export * from './types';

// Registro de proveedores disponibles. Para añadir otra fuente (Wiktionary,
// Datamuse, etc.) basta con registrarla aquí.
export const PROVIDERS: DefinitionProvider[] = [freeDictionaryProvider, manualProvider];

const byId = new Map<ProviderId, DefinitionProvider>(
  PROVIDERS.map((p) => [p.id, p]),
);

export function getProvider(id: ProviderId): DefinitionProvider {
  return byId.get(id) ?? freeDictionaryProvider;
}
