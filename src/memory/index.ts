/**
 * src/memory/index.ts
 * Public entry point for OmniSign Translation Memory Layer.
 */

export { MemoryLayer, normalizeSequenceKey, DEFAULT_COUNTER_MEMORIES } from './MemoryLayer';
export { FileMemoryStore, InMemoryStore } from './MemoryStore';
export type { MemoryEntry, MemoryLookupResult, MemoryStoreAdapter } from './types';
