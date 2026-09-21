/**
 * src/embeddings/types.ts
 * Types for OmniSign metric prototype embeddings.
 */

export type EmbeddingVector = number[];

export interface SignPrototype {
  id: string;
  label: string;
  vector: EmbeddingVector;
  sampleCount: number;
  createdAt: number;
}

export interface BaseClassifierResult {
  label: string;
  confidence: number;
}

export type RecognitionResult =
  | { kind: 'base'; label: string; confidence: number }
  | { kind: 'custom'; prototype: SignPrototype; similarity: number }
  | { kind: 'unknown' };

export interface CollisionWarning {
  against: 'custom' | 'base';
  label: string;
  similarity: number;
}
