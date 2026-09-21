/**
 * src/embeddings/similarity.ts
 * Vector operations and cosine similarity for OmniSign gesture embeddings.
 */

import type { EmbeddingVector } from './types';

/**
 * Computes cosine similarity between two feature vectors in [-1, 1].
 * Normalizes for vector scale, focusing purely on geometric shape orientation.
 */
export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (a.length !== b.length) {
    throw new Error(`cosineSimilarity dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Computes centroid prototype from multiple enrollment repetitions.
 */
export function averageVectors(vectors: EmbeddingVector[]): EmbeddingVector {
  if (vectors.length === 0) {
    throw new Error('averageVectors requires at least one vector');
  }
  const dim = vectors[0].length;
  const sum = new Array<number>(dim).fill(0);
  for (const v of vectors) {
    if (v.length !== dim) {
      throw new Error('averageVectors: all vectors must match dimension');
    }
    for (let i = 0; i < dim; i++) {
      sum[i] += v[i];
    }
  }
  return sum.map(x => x / vectors.length);
}
