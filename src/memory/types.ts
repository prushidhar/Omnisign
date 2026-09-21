/**
 * src/memory/types.ts
 * Types for OmniSign on-device translation memory layer.
 */

export interface MemoryEntry {
  id: string;
  tokens: string[];
  normalizedKey: string;
  translations: {
    en: string;
    hi?: string;
    te?: string;
  };
  useCount: number;
  lastUsedAt: number;
  scenario?: string;
}

export type MemoryLookupResult =
  | { kind: 'exact'; match: MemoryEntry }
  | { kind: 'fuzzy'; matches: MemoryEntry[] }
  | { kind: 'miss' };

export interface MemoryStoreAdapter {
  load(): Promise<MemoryEntry[]>;
  save(entries: MemoryEntry[]): Promise<void>;
}
