/**
 * src/memory/MemoryStore.ts
 * Atomic disk persistence for OmniSign Translation Memory.
 */

import RNFS from 'react-native-fs';
import type { MemoryEntry, MemoryStoreAdapter } from './types';

export const MEMORY_STORE_PATH = `${RNFS.DocumentDirectoryPath}/omnisign_memory.json`;
const TEMP_PATH = `${MEMORY_STORE_PATH}.tmp`;

export class FileMemoryStore implements MemoryStoreAdapter {
  async load(): Promise<MemoryEntry[]> {
    try {
      const exists = await RNFS.exists(MEMORY_STORE_PATH);
      if (!exists) return [];
      const raw = await RNFS.readFile(MEMORY_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async save(entries: MemoryEntry[]): Promise<void> {
    try {
      await RNFS.writeFile(TEMP_PATH, JSON.stringify(entries, null, 2), 'utf8');
      if (await RNFS.exists(MEMORY_STORE_PATH)) {
        await RNFS.unlink(MEMORY_STORE_PATH);
      }
      await RNFS.moveFile(TEMP_PATH, MEMORY_STORE_PATH);
    } catch (err) {
      console.warn('[FileMemoryStore] Error persisting memory:', err);
    }
  }
}

export class InMemoryStore implements MemoryStoreAdapter {
  private data: MemoryEntry[] = [];

  constructor(initialData: MemoryEntry[] = []) {
    this.data = [...initialData];
  }

  async load(): Promise<MemoryEntry[]> {
    return [...this.data];
  }

  async save(entries: MemoryEntry[]): Promise<void> {
    this.data = [...entries];
  }
}
