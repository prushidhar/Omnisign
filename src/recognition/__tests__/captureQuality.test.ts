import {
  isValidLandmarks,
  handSpread,
  maxJitter,
  assessCapture,
  REQUIRED_LANDMARK_COUNT,
  MIN_HAND_SPREAD,
  MAX_JITTER,
} from '../captureQuality';
import type { HandLandmark } from '../types';

describe('captureQuality (OmniSign gatekeeper)', () => {
  function makeValidHand(spread = 0.3): HandLandmark[] {
    const list: HandLandmark[] = [];
    for (let i = 0; i < REQUIRED_LANDMARK_COUNT; i++) {
      list.push({
        x: 0.2 + (i / 20) * spread,
        y: 0.2 + (i / 20) * spread,
        z: 0.0,
      });
    }
    return list;
  }

  describe('isValidLandmarks', () => {
    it('returns true for exactly 21 finite coordinate points', () => {
      const hand = makeValidHand();
      expect(isValidLandmarks(hand)).toBe(true);
    });

    it('rejects null, undefined, or wrong array lengths', () => {
      expect(isValidLandmarks(null)).toBe(false);
      expect(isValidLandmarks(undefined)).toBe(false);
      expect(isValidLandmarks([])).toBe(false);
      expect(isValidLandmarks(new Array(20).fill({ x: 0, y: 0, z: 0 }))).toBe(false);
      expect(isValidLandmarks(new Array(22).fill({ x: 0, y: 0, z: 0 }))).toBe(false);
    });

    it('rejects hands with NaN, Infinity, or missing coordinates', () => {
      const hand = makeValidHand();
      hand[5] = { x: NaN, y: 0.5, z: 0.1 };
      expect(isValidLandmarks(hand)).toBe(false);

      const handInf = makeValidHand();
      handInf[10] = { x: 0.5, y: Infinity, z: 0.1 };
      expect(isValidLandmarks(handInf)).toBe(false);

      const handCorrupt = makeValidHand();
      (handCorrupt[0] as any).x = 'not-a-number';
      expect(isValidLandmarks(handCorrupt)).toBe(false);
    });
  });

  describe('handSpread', () => {
    it('computes Euclidean diagonal across bounding box', () => {
      const hand: HandLandmark[] = new Array(REQUIRED_LANDMARK_COUNT).fill(null).map((_, idx) => ({
        x: idx === 0 ? 0.1 : idx === 1 ? 0.4 : 0.2, // minX=0.1, maxX=0.4 (dx=0.3)
        y: idx === 0 ? 0.2 : idx === 1 ? 0.6 : 0.3, // minY=0.2, maxY=0.6 (dy=0.4)
        z: 0,
      }));
      // diagonal = sqrt(0.3^2 + 0.4^2) = 0.5
      expect(handSpread(hand)).toBeCloseTo(0.5, 4);
    });
  });

  describe('maxJitter', () => {
    it('returns 0 for identical consecutive samples', () => {
      const hand = makeValidHand();
      const samples = [hand, hand, hand];
      expect(maxJitter(samples)).toBe(0);
    });

    it('detects maximum single-point movement across frames', () => {
      const frame1 = makeValidHand();
      const frame2 = makeValidHand();
      // Move landmark 8 by 0.05
      frame2[8] = { x: frame2[8].x + 0.05, y: frame2[8].y, z: frame2[8].z };
      expect(maxJitter([frame1, frame2])).toBeCloseTo(0.05, 4);
    });
  });

  describe('assessCapture', () => {
    it('returns "no-hand" when landmarks are missing or invalid', () => {
      expect(assessCapture(null, [])).toBe('no-hand');
      expect(assessCapture([], [])).toBe('no-hand');
    });

    it('returns "too-far" when hand bounding spread is below MIN_HAND_SPREAD', () => {
      const tinyHand = makeValidHand(MIN_HAND_SPREAD - 0.05);
      expect(assessCapture(tinyHand, [tinyHand])).toBe('too-far');
    });

    it('returns "unstable" when samples have jitter above MAX_JITTER', () => {
      const steadyHand = makeValidHand(0.3);
      const jitteredHand = makeValidHand(0.3);
      jitteredHand[4] = {
        x: jitteredHand[4].x + MAX_JITTER + 0.05,
        y: jitteredHand[4].y,
        z: jitteredHand[4].z,
      };

      expect(assessCapture(steadyHand, [steadyHand, jitteredHand])).toBe('unstable');
    });

    it('returns null when capture meets all quality criteria', () => {
      const goodHand1 = makeValidHand(0.3);
      const goodHand2 = makeValidHand(0.3);
      expect(assessCapture(goodHand1, [goodHand1, goodHand2])).toBeNull();
    });
  });
});
