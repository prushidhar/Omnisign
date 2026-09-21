import {
  cosineSimilarity,
  averageVectors,
  findBestMatch,
  decideRecognition,
  checkEnrollmentCollision,
  PrototypeStore,
} from '../index';
import type { SignPrototype } from '../types';

describe('prototypeStore & embeddings matching', () => {
  describe('cosineSimilarity', () => {
    it('returns 1.0 for identical vectors', () => {
      const v = [1, 2, 3, 4];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
    });

    it('returns 0.0 for orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
    });

    it('returns -1.0 for opposite vectors', () => {
      const a = [1, 2];
      const b = [-1, -2];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
    });

    it('throws error on dimension mismatch', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });
  });

  describe('averageVectors', () => {
    it('computes correct mean centroid', () => {
      const v1 = [1.0, 2.0, 3.0];
      const v2 = [3.0, 4.0, 5.0];
      const avg = averageVectors([v1, v2]);
      expect(avg).toEqual([2.0, 3.0, 4.0]);
    });
  });

  describe('findBestMatch', () => {
    const prototypes: SignPrototype[] = [
      { id: '1', label: 'DOCTOR', vector: [1, 0, 0], sampleCount: 1, createdAt: 0 },
      { id: '2', label: 'MEDICINE', vector: [0, 1, 0], sampleCount: 1, createdAt: 0 },
    ];

    it('returns closest prototype when above threshold and beats margin', () => {
      const live = [0.95, 0.05, 0];
      const match = findBestMatch(live, prototypes, { threshold: 0.8, minMargin: 0.05 });
      expect(match).not.toBeNull();
      expect(match?.prototype.label).toBe('DOCTOR');
    });

    it('rejects match if below threshold', () => {
      const live = [0.5, 0.5, 0.7];
      const match = findBestMatch(live, prototypes, { threshold: 0.9 });
      expect(match).toBeNull();
    });

    it('rejects ambiguous tie when difference is less than margin', () => {
      const live = [0.707, 0.707, 0]; // Equally close to both [1,0,0] and [0,1,0]
      const match = findBestMatch(live, prototypes, { threshold: 0.5, minMargin: 0.1 });
      expect(match).toBeNull();
    });
  });

  describe('decideRecognition', () => {
    const prototypes: SignPrototype[] = [
      { id: '1', label: 'EMERGENCY_CUSTOM', vector: [1, 0, 0], sampleCount: 1, createdAt: 0 },
    ];

    it('trusts base classifier when confidence >= threshold', () => {
      const decision = decideRecognition(
        { label: 'HELP_BASE', confidence: 0.95 },
        [1, 0, 0],
        prototypes,
        { baseConfidenceThreshold: 0.8, custom: { threshold: 0.8 } },
      );

      expect(decision.kind).toBe('base');
      if (decision.kind === 'base') {
        expect(decision.label).toBe('HELP_BASE');
        expect(decision.confidence).toBe(0.95);
      }
    });

    it('falls back to custom prototype when base classifier is unsure', () => {
      const decision = decideRecognition(
        { label: 'HELP_BASE', confidence: 0.4 }, // Low confidence base
        [0.98, 0.02, 0],
        prototypes,
        { baseConfidenceThreshold: 0.8, custom: { threshold: 0.8 } },
      );

      expect(decision.kind).toBe('custom');
      if (decision.kind === 'custom') {
        expect(decision.prototype.label).toBe('EMERGENCY_CUSTOM');
      }
    });

    it('returns unknown when neither base nor custom is confident', () => {
      const decision = decideRecognition(
        { label: 'HELP_BASE', confidence: 0.3 },
        [0, 1, 0], // Does not match EMERGENCY_CUSTOM
        prototypes,
        { baseConfidenceThreshold: 0.8, custom: { threshold: 0.8 } },
      );

      expect(decision.kind).toBe('unknown');
    });
  });

  describe('checkEnrollmentCollision', () => {
    it('detects collision with existing custom prototype', () => {
      const existing: SignPrototype[] = [
        { id: '1', label: 'TOKEN_A', vector: [1, 0, 0], sampleCount: 1, createdAt: 0 },
      ];
      const collision = checkEnrollmentCollision([0.98, 0.02, 0], existing, [], 0.9);
      expect(collision).not.toBeNull();
      expect(collision?.against).toBe('custom');
      expect(collision?.label).toBe('TOKEN_A');
    });
  });

  describe('PrototypeStore', () => {
    it('enrolls and averages multiple repetition vectors', async () => {
      const store = new PrototypeStore();
      const p = await store.enroll('TEST_SIGN', [
        [1, 2, 3],
        [3, 4, 5],
      ]);

      expect(p.label).toBe('TEST_SIGN');
      expect(p.vector).toEqual([2, 3, 4]);
      expect(p.sampleCount).toBe(2);
      expect(store.getAll().length).toBe(1);
    });

    it('deletes prototype by id', async () => {
      const store = new PrototypeStore();
      const p = await store.enroll('DELETE_ME', [[1, 0, 0]]);
      expect(store.getAll().length).toBe(1);

      await store.delete(p.id);
      expect(store.getAll().length).toBe(0);
    });
  });
});
