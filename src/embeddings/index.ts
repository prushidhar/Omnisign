/**
 * src/embeddings/index.ts
 * Public entry point for OmniSign metric prototype embeddings.
 */

export { cosineSimilarity, averageVectors } from './similarity';
export { findBestMatch, decideRecognition, checkEnrollmentCollision } from './matching';
export { PrototypeStore, PROTOTYPE_STORE_PATH } from './prototypeStore';
export type {
  EmbeddingVector,
  SignPrototype,
  BaseClassifierResult,
  RecognitionResult,
  CollisionWarning,
} from './types';
export type { MatchOptions, DecideRecognitionOptions } from './matching';
