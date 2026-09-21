import {
  buildFeatureVector,
  featureDistance,
  recognizeGesture,
  createTemplate,
  LandmarkSmoother,
  MATCH_THRESHOLD,
  classifyBiomechanical,
  classifyDeliveryGesture,
  recognizeWithBiomechanicalFallback,
} from '../gestureEngine';
import { BUNDLED_TEMPLATES } from '../bundledTemplates';
import type { HandLandmark, GestureTemplate } from '../types';

describe('gestureEngine (OmniSign pure TS recognition)', () => {
  // Helper to generate 21 synthetic landmarks
  function makeLandmarks(scale = 1.0, offset = { x: 0, y: 0, z: 0 }): HandLandmark[] {
    const list: HandLandmark[] = [];
    for (let i = 0; i < 21; i++) {
      list.push({
        x: (i * 0.05 + offset.x) * scale,
        y: (i * 0.03 + offset.y) * scale,
        z: (i * 0.01 + offset.z) * scale,
      });
    }
    return list;
  }

  it('rejects invalid or incomplete landmark arrays', () => {
    expect(buildFeatureVector([])).toBeNull();
    expect(buildFeatureVector(null as any)).toBeNull();
    expect(buildFeatureVector(new Array(10).fill({ x: 0, y: 0, z: 0 }))).toBeNull();
  });

  it('produces an exact 72-dimensional feature vector', () => {
    const lm = makeLandmarks();
    const vec = buildFeatureVector(lm);
    expect(vec).not.toBeNull();
    expect(vec?.length).toBe(72);
  });

  it('is scale invariant (wrist normalized)', () => {
    const lm1 = makeLandmarks(1.0);
    const lm2 = makeLandmarks(2.5); // 2.5x larger hand
    const vec1 = buildFeatureVector(lm1)!;
    const vec2 = buildFeatureVector(lm2)!;

    const dist = featureDistance(vec1, vec2);
    expect(dist).toBeCloseTo(0, 5);
  });

  it('is translation invariant (wrist origin normalized)', () => {
    const lm1 = makeLandmarks(1.0, { x: 0, y: 0, z: 0 });
    const lm2 = makeLandmarks(1.0, { x: 100, y: -50, z: 25 }); // translated across frame
    const vec1 = buildFeatureVector(lm1)!;
    const vec2 = buildFeatureVector(lm2)!;

    const dist = featureDistance(vec1, vec2);
    expect(dist).toBeCloseTo(0, 5);
  });

  it('correctly matches identical gesture within threshold', () => {
    const lm = makeLandmarks();
    const template = createTemplate('MEDICINE', lm)!;
    expect(template).not.toBeNull();

    const result = recognizeGesture(lm, [template]);
    expect(result.isKnown).toBe(true);
    expect(result.label).toBe('MEDICINE');
    expect(result.distance).toBeCloseTo(0, 5);
  });

  it('returns UNKNOWN if hand pose is too dissimilar', () => {
    const lm1 = makeLandmarks();
    const template = createTemplate('HELP', lm1)!;

    // Distort landmarks significantly
    const lmDistorted: HandLandmark[] = lm1.map((p, idx) => ({
      x: p.x + (idx % 2 === 0 ? 0.8 : -0.8),
      y: p.y - 0.5,
      z: p.z + 0.2,
    }));

    const result = recognizeGesture(lmDistorted, [template], MATCH_THRESHOLD);
    expect(result.isKnown).toBe(false);
    expect(result.label).toBe('UNKNOWN');
    expect(result.distance).toBeGreaterThan(MATCH_THRESHOLD);
  });

  describe('LandmarkSmoother (Temporal EMA Filter)', () => {
    it('attenuates high-frequency frame jitter', () => {
      const smoother = new LandmarkSmoother(0.5);
      const frame1 = makeLandmarks(1.0, { x: 0, y: 0, z: 0 });
      const frame2 = makeLandmarks(1.0, { x: 1.0, y: 1.0, z: 0 }); // Sudden jitter jump

      const s1 = smoother.smooth(frame1)!;
      expect(s1).toBeDefined();
      expect(s1[0].x).toBeCloseTo(frame1[0].x, 3);

      const s2 = smoother.smooth(frame2)!;
      // EMA with alpha 0.5 should put point at halfway between 0 and 1.0
      expect(s2[0].x).toBeCloseTo(0.5, 2);
    });

    it('resets state properly', () => {
      const smoother = new LandmarkSmoother();
      smoother.smooth(makeLandmarks());
      smoother.reset();
      const next = smoother.smooth(makeLandmarks(2.0));
      expect(next).not.toBeNull();
    });
  });

  describe('Full ISL Lexicon & Zero-Shot Gesture Calibration', () => {
    it('bundles a rich vocabulary spanning alphabet and core service signs', () => {
      expect(BUNDLED_TEMPLATES.length).toBeGreaterThanOrEqual(30);

      const labels = BUNDLED_TEMPLATES.map(t => t.label);
      // Alphabet fingerspelling check
      expect(labels).toContain('A');
      expect(labels).toContain('B');
      expect(labels).toContain('C');
      expect(labels).toContain('L');

      // Core service signs check
      expect(labels).toContain('HELP');
      expect(labels).toContain('MEDICINE');
      expect(labels).toContain('PRESCRIPTION');
      expect(labels).toContain('DOCTOR');
      expect(labels).toContain('ACCOUNT');
      expect(labels).toContain('THANK-YOU');
    });

    it('calibrates and learns arbitrary custom signs on-the-fly', () => {
      const customSignLandmarks = makeLandmarks(1.5, { x: 0.1, y: 0.2, z: -0.1 });
      const customTemplate = createTemplate('INSURANCE', customSignLandmarks);
      expect(customTemplate).not.toBeNull();
      expect(customTemplate?.label).toBe('INSURANCE');
      expect(customTemplate?.features.length).toBe(72);

      // Verify immediate zero-shot matching
      const match = recognizeGesture(customSignLandmarks, [customTemplate!]);
      expect(match.isKnown).toBe(true);
      expect(match.label).toBe('INSURANCE');
      expect(match.distance).toBeCloseTo(0, 4);
    });
  });

  describe('Biomechanical Heuristic Classifier & Fallbacks', () => {
    // Helper to generate a realistic hand pose with controllable finger extensions
    function makePosedHand(opts: {
      thumb?: boolean;
      index?: boolean;
      mid?: boolean;
      ring?: boolean;
      pinky?: boolean;
    }): HandLandmark[] {
      const wrist: HandLandmark = { x: 0.5, y: 0.8, z: 0 };
      const lm: HandLandmark[] = new Array(21).fill(null).map(() => ({ x: 0.5, y: 0.8, z: 0 }));
      lm[0] = wrist;

      // Thumb (1, 2, 3, 4)
      lm[1] = { x: 0.45, y: 0.75, z: 0 };
      lm[2] = { x: 0.40, y: 0.70, z: 0 };
      lm[3] = { x: 0.38, y: 0.65, z: 0 };
      lm[4] = opts.thumb ? { x: 0.25, y: 0.55, z: 0 } : { x: 0.45, y: 0.68, z: 0 };

      // Index (5, 6, 7, 8)
      lm[5] = { x: 0.45, y: 0.65, z: 0 };
      lm[6] = { x: 0.45, y: 0.55, z: 0 };
      lm[7] = { x: 0.45, y: 0.45, z: 0 };
      lm[8] = opts.index ? { x: 0.45, y: 0.25, z: 0 } : { x: 0.45, y: 0.62, z: 0 };

      // Middle (9, 10, 11, 12)
      lm[9] = { x: 0.50, y: 0.65, z: 0 };
      lm[10] = { x: 0.50, y: 0.55, z: 0 };
      lm[11] = { x: 0.50, y: 0.45, z: 0 };
      lm[12] = opts.mid ? { x: 0.50, y: 0.22, z: 0 } : { x: 0.50, y: 0.62, z: 0 };

      // Ring (13, 14, 15, 16)
      lm[13] = { x: 0.55, y: 0.65, z: 0 };
      lm[14] = { x: 0.55, y: 0.55, z: 0 };
      lm[15] = { x: 0.55, y: 0.45, z: 0 };
      lm[16] = opts.ring ? { x: 0.55, y: 0.25, z: 0 } : { x: 0.55, y: 0.62, z: 0 };

      // Pinky (17, 18, 19, 20)
      lm[17] = { x: 0.60, y: 0.67, z: 0 };
      lm[18] = { x: 0.60, y: 0.58, z: 0 };
      lm[19] = { x: 0.60, y: 0.50, z: 0 };
      lm[20] = opts.pinky ? { x: 0.60, y: 0.30, z: 0 } : { x: 0.60, y: 0.64, z: 0 };

      return lm;
    }

    it('handles null and insufficient landmarks gracefully', () => {
      expect(classifyBiomechanical(null)).toBeNull();
      expect(classifyBiomechanical([])).toBeNull();
      expect(classifyBiomechanical(new Array(15).fill({ x: 0, y: 0, z: 0 }))).toBeNull();
    });

    it('identifies open hand (HELP) when all fingers are extended', () => {
      const openHand = makePosedHand({ thumb: true, index: true, mid: true, ring: true, pinky: true });
      const result = classifyBiomechanical(openHand);
      expect(result).not.toBeNull();
      expect(result?.label).toBe('HELP');
      expect(result?.isKnown).toBe(true);
    });

    it('identifies pointing gesture (APPOINTMENT) when index is extended alone', () => {
      const pointHand = makePosedHand({ thumb: false, index: true, mid: false, ring: false, pinky: false });
      const result = classifyBiomechanical(pointHand);
      expect(result).not.toBeNull();
      expect(result?.label).toBe('APPOINTMENT');
      expect(result?.isKnown).toBe(true);
    });

    it('identifies closed fist (PAIN) when all fingers are curled', () => {
      const fistHand = makePosedHand({ thumb: false, index: false, mid: false, ring: false, pinky: false });
      const result = classifyBiomechanical(fistHand);
      expect(result).not.toBeNull();
      expect(result?.label).toBe('PAIN');
      expect(result?.isKnown).toBe(true);
    });

    it('identifies thumbs up (THANK-YOU) when thumb is extended upright and fingers are curled', () => {
      const thumbsUp = makePosedHand({ thumb: true, index: false, mid: false, ring: false, pinky: false });
      // Point thumb upward above index MCP
      thumbsUp[4] = { x: 0.35, y: 0.45, z: 0 };
      const result = classifyBiomechanical(thumbsUp);
      expect(result).not.toBeNull();
      expect(result?.label).toBe('THANK-YOU');
      expect(result?.isKnown).toBe(true);
    });

    it('falls back seamlessly in recognizeWithBiomechanicalFallback when no template matches', () => {
      const openHand = makePosedHand({ thumb: true, index: true, mid: true, ring: true, pinky: true });
      const unrelated = createTemplate('UNRELATED', makeLandmarks())!;
      
      const match = recognizeWithBiomechanicalFallback(openHand, [unrelated]);
      expect(match.isKnown).toBe(true);
      expect(match.label).toBe('HELP');
    });
  });

  describe('classifyDeliveryGesture (Zomato / Swiggy / Transit Direction Rules)', () => {
    function makePosedHand(opts: {
      thumb?: boolean;
      index?: boolean;
      mid?: boolean;
      ring?: boolean;
      pinky?: boolean;
    }): HandLandmark[] {
      const wrist: HandLandmark = { x: 0.5, y: 0.8, z: 0 };
      const lm: HandLandmark[] = new Array(21).fill(null).map(() => ({ x: 0.5, y: 0.8, z: 0 }));
      lm[0] = wrist;

      // Thumb
      lm[1] = { x: 0.45, y: 0.75, z: 0 };
      lm[2] = { x: 0.40, y: 0.70, z: 0 };
      lm[3] = { x: 0.38, y: 0.65, z: 0 };
      lm[4] = opts.thumb ? { x: 0.25, y: 0.55, z: 0 } : { x: 0.45, y: 0.68, z: 0 };

      // Index
      lm[5] = { x: 0.45, y: 0.65, z: 0 };
      lm[6] = { x: 0.45, y: 0.55, z: 0 };
      lm[7] = { x: 0.45, y: 0.45, z: 0 };
      lm[8] = opts.index ? { x: 0.45, y: 0.25, z: 0 } : { x: 0.45, y: 0.62, z: 0 };

      // Middle
      lm[9] = { x: 0.50, y: 0.65, z: 0 };
      lm[10] = { x: 0.50, y: 0.55, z: 0 };
      lm[11] = { x: 0.50, y: 0.45, z: 0 };
      lm[12] = opts.mid ? { x: 0.50, y: 0.22, z: 0 } : { x: 0.50, y: 0.62, z: 0 };

      // Ring
      lm[13] = { x: 0.55, y: 0.65, z: 0 };
      lm[14] = { x: 0.55, y: 0.55, z: 0 };
      lm[15] = { x: 0.55, y: 0.45, z: 0 };
      lm[16] = opts.ring ? { x: 0.55, y: 0.25, z: 0 } : { x: 0.55, y: 0.62, z: 0 };

      // Pinky
      lm[17] = { x: 0.60, y: 0.67, z: 0 };
      lm[18] = { x: 0.60, y: 0.58, z: 0 };
      lm[19] = { x: 0.60, y: 0.50, z: 0 };
      lm[20] = opts.pinky ? { x: 0.60, y: 0.30, z: 0 } : { x: 0.60, y: 0.64, z: 0 };

      return lm;
    }

    it('returns null on empty/null landmarks', () => {
      expect(classifyDeliveryGesture(null)).toBeNull();
      expect(classifyDeliveryGesture([])).toBeNull();
    });

    it('detects GATE_LEFT when index points to the left', () => {
      const hand = makePosedHand({ index: true });
      // Point index tip far left of MCP
      hand[8] = { x: 0.25, y: 0.60, z: 0 };
      const res = classifyDeliveryGesture(hand);
      expect(res?.label).toBe('GATE_LEFT');
      expect(res?.isKnown).toBe(true);
    });

    it('detects GATE_RIGHT when index points to the right', () => {
      const hand = makePosedHand({ index: true });
      // Point index tip far right of MCP
      hand[8] = { x: 0.65, y: 0.60, z: 0 };
      const res = classifyDeliveryGesture(hand);
      expect(res?.label).toBe('GATE_RIGHT');
      expect(res?.isKnown).toBe(true);
    });

    it('detects COMING_DOWN when index points downward', () => {
      const hand = makePosedHand({ index: true });
      // Point index tip downward below wrist
      hand[8] = { x: 0.45, y: 0.95, z: 0 };
      const res = classifyDeliveryGesture(hand);
      expect(res?.label).toBe('COMING_DOWN');
      expect(res?.isKnown).toBe(true);
    });

    it('detects FLOOR_2 with V-sign (index + middle)', () => {
      const hand = makePosedHand({ index: true, mid: true });
      const res = classifyDeliveryGesture(hand);
      expect(res?.label).toBe('FLOOR_2');
      expect(res?.isKnown).toBe(true);
    });

    it('detects YES with thumbs up', () => {
      const hand = makePosedHand({ thumb: true });
      hand[4] = { x: 0.35, y: 0.45, z: 0 };
      const res = classifyDeliveryGesture(hand);
      expect(res?.label).toBe('YES');
      expect(res?.isKnown).toBe(true);
    });

    it('detects DOOR with open flat palm forward', () => {
      const hand = makePosedHand({ thumb: true, index: true, mid: true, ring: true, pinky: true });
      const res = classifyDeliveryGesture(hand);
      expect(res?.label).toBe('DOOR');
      expect(res?.isKnown).toBe(true);
    });
  });
});


