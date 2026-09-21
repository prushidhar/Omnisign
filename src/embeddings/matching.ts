/**
 * src/embeddings/matching.ts
 * Dual-tier decision engine combining base classifier with custom prototype matching.
 */

import { cosineSimilarity } from './similarity';
import type {
  BaseClassifierResult,
  CollisionWarning,
  EmbeddingVector,
  RecognitionResult,
  SignPrototype,
} from './types';

export interface MatchOptions {
  /** Minimum cosine similarity to accept a prototype match. Default 0.82. */
  threshold: number;
  /** Margin by which the best candidate must exceed runner-up. Default 0.05. */
  minMargin?: number;
}

/**
 * Nearest-neighbor cosine search across stored custom prototypes.
 * Rejects near-ties below minMargin to avoid ambiguous predictions.
 */
export function findBestMatch(
  liveVector: EmbeddingVector,
  prototypes: readonly SignPrototype[],
  opts: MatchOptions,
): { prototype: SignPrototype; similarity: number } | null {
  if (prototypes.length === 0) return null;

  const scored = prototypes
    .map(p => ({ prototype: p, similarity: cosineSimilarity(liveVector, p.vector) }))
    .sort((a, b) => b.similarity - a.similarity);

  const best = scored[0];
  if (best.similarity < opts.threshold) return null;

  const runnerUp = scored[1];
  const margin = opts.minMargin ?? 0.05;
  if (runnerUp && best.similarity - runnerUp.similarity < margin) {
    return null; // Margin too small, reject ambiguous tie
  }

  return best;
}

export interface DecideRecognitionOptions {
  baseConfidenceThreshold: number;
  custom: MatchOptions;
}

/**
 * Two-tier recognition decision:
 * 1. If base classifier is confident (>= baseConfidenceThreshold), trust base output.
 * 2. If base is unsure, consult custom prototype embeddings.
 * 3. If neither is confident, return unknown.
 */
export function decideRecognition(
  baseResult: BaseClassifierResult | null,
  liveVector: EmbeddingVector | null,
  prototypes: readonly SignPrototype[],
  opts: DecideRecognitionOptions,
): RecognitionResult {
  if (baseResult && baseResult.confidence >= opts.baseConfidenceThreshold) {
    return {
      kind: 'base',
      label: baseResult.label,
      confidence: baseResult.confidence,
    };
  }

  if (liveVector && prototypes.length > 0) {
    const customMatch = findBestMatch(liveVector, prototypes, opts.custom);
    if (customMatch) {
      return {
        kind: 'custom',
        prototype: customMatch.prototype,
        similarity: customMatch.similarity,
      };
    }
  }

  return { kind: 'unknown' };
}

/**
 * Checks for potential geometric collisions during enrollment of a new custom sign.
 */
export function checkEnrollmentCollision(
  candidateVector: EmbeddingVector,
  existingCustom: readonly SignPrototype[],
  basePrototypes: readonly { label: string; vector: EmbeddingVector }[],
  warningThreshold = 0.88,
): CollisionWarning | null {
  for (const p of existingCustom) {
    const sim = cosineSimilarity(candidateVector, p.vector);
    if (sim >= warningThreshold) {
      return { against: 'custom', label: p.label, similarity: sim };
    }
  }

  for (const b of basePrototypes) {
    const sim = cosineSimilarity(candidateVector, b.vector);
    if (sim >= warningThreshold) {
      return { against: 'base', label: b.label, similarity: sim };
    }
  }

  return null;
}
