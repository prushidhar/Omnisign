/**
 * src/embeddings/prototypeStore.ts
 * In-memory and persistent storage for user-calibrated sign prototypes.
 */

import RNFS from 'react-native-fs';
import { averageVectors } from './similarity';
import type { EmbeddingVector, SignPrototype } from './types';

export const PROTOTYPE_STORE_PATH = `${RNFS.DocumentDirectoryPath}/omnisign_prototypes.json`;
const TEMP_PATH = `${PROTOTYPE_STORE_PATH}.tmp`;

export class PrototypeStore {
  private prototypes: SignPrototype[] = [];

  constructor(initial: SignPrototype[] = []) {
    this.prototypes = [...initial];
  }

  async load(): Promise<SignPrototype[]> {
    try {
      const exists = await RNFS.exists(PROTOTYPE_STORE_PATH);
      if (!exists) return this.prototypes;
      const raw = await RNFS.readFile(PROTOTYPE_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.prototypes = parsed;
      }
      return this.prototypes;
    } catch {
      return this.prototypes;
    }
  }

  async enroll(label: string, sampleVectors: EmbeddingVector[]): Promise<SignPrototype> {
    if (sampleVectors.length === 0) {
      throw new Error('enroll requires at least one sample vector');
    }

    const vector = averageVectors(sampleVectors);
    const existingIndex = this.prototypes.findIndex(
      p => p.label.trim().toUpperCase() === label.trim().toUpperCase(),
    );

    const prototype: SignPrototype = {
      id: existingIndex >= 0 ? this.prototypes[existingIndex].id : `proto-${Date.now()}`,
      label: label.trim().toUpperCase(),
      vector,
      sampleCount: sampleVectors.length,
      createdAt: Date.now(),
    };

    if (existingIndex >= 0) {
      this.prototypes[existingIndex] = prototype;
    } else {
      this.prototypes.push(prototype);
    }

    await this.persist();
    return prototype;
  }

  async delete(id: string): Promise<void> {
    this.prototypes = this.prototypes.filter(p => p.id !== id);
    await this.persist();
  }

  async clear(): Promise<void> {
    this.prototypes = [];
    if (await RNFS.exists(PROTOTYPE_STORE_PATH)) {
      await RNFS.unlink(PROTOTYPE_STORE_PATH).catch(() => {});
    }
  }

  getAll(): SignPrototype[] {
    return [...this.prototypes];
  }

  private async persist(): Promise<void> {
    try {
      await RNFS.writeFile(TEMP_PATH, JSON.stringify(this.prototypes, null, 2), 'utf8');
      if (await RNFS.exists(PROTOTYPE_STORE_PATH)) {
        await RNFS.unlink(PROTOTYPE_STORE_PATH);
      }
      await RNFS.moveFile(TEMP_PATH, PROTOTYPE_STORE_PATH);
    } catch (err) {
      console.warn('[PrototypeStore] Failed to persist:', err);
    }
  }
}
