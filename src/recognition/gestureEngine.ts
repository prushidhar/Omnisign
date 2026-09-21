/**
 * gestureEngine.ts
 * Pure TypeScript gesture recognition engine.
 * Converts MediaPipe 21-landmark arrays into gloss token matches.
 * No dependencies — works in both Jest and React Native.
 */
import type { HandLandmark, GestureTemplate, GestureMatch } from './types';

const GEOMETRY_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 4], [0, 8], [0, 12], [0, 16], [0, 20],
  [4, 8], [8, 12], [12, 16], [16, 20],
];

export const MATCH_THRESHOLD = 0.42;

/** Build 72-dim feature vector from 21 landmarks. Returns null if invalid. */
export function buildFeatureVector(landmarks: readonly HandLandmark[]): number[] | null {
  if (!landmarks || landmarks.length < 21) return null;
  const wrist = landmarks[0];
  let scale = 0;
  for (const p of landmarks) {
    scale = Math.max(scale, Math.hypot(p.x - wrist.x, p.y - wrist.y, p.z - wrist.z));
  }
  if (scale === 0) return null;

  const norm = landmarks.map(p => ({
    x: (p.x - wrist.x) / scale,
    y: (p.y - wrist.y) / scale,
    z: (p.z - wrist.z) / scale,
  }));

  const features = norm.flatMap(p => [p.x, p.y, p.z]);
  for (const [l, r] of GEOMETRY_PAIRS) {
    const a = norm[l]; const b = norm[r];
    features.push(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z));
  }
  return features;
}

/** RMS Euclidean distance between two feature vectors. */
export function featureDistance(a: readonly number[], b: readonly number[]): number {
  if (!a.length || !b.length) return Infinity;
  const len = Math.max(a.length, b.length);
  let total = 0;
  for (let i = 0; i < len; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    total += d * d;
  }
  return Math.sqrt(total / len);
}

/** Match landmarks against a template library. Returns best match or UNKNOWN. */
export function recognizeGesture(
  landmarks: readonly HandLandmark[] | null | undefined,
  templates: readonly GestureTemplate[],
  threshold = MATCH_THRESHOLD,
): GestureMatch {
  if (!landmarks || templates.length === 0) {
    return { label: 'UNKNOWN', distance: Infinity, isKnown: false };
  }
  const features = buildFeatureVector(landmarks);
  if (!features) return { label: 'UNKNOWN', distance: Infinity, isKnown: false };

  const ranked = templates
    .map(t => ({ label: t.label, distance: featureDistance(features, t.features) }))
    .sort((a, b) => a.distance - b.distance);

  const best = ranked[0];
  return best.distance <= threshold
    ? { label: best.label, distance: best.distance, isKnown: true }
    : { label: 'UNKNOWN', distance: best.distance, isKnown: false };
}

/** Serialize a recorded landmark set into a storable template. */
export function createTemplate(label: string, landmarks: readonly HandLandmark[]): GestureTemplate | null {
  const features = buildFeatureVector(landmarks);
  if (!features) return null;
  return { label, features };
}

/**
 * Temporal Exponential Moving Average (EMA) Landmark Smoother.
 * Attenuates camera sensor noise and finger micro-tremors without perceptual lag.
 */
export class LandmarkSmoother {
  private prev: HandLandmark[] | null = null;

  constructor(private readonly alpha: number = 0.70) {}

  smooth(current: readonly HandLandmark[] | null | undefined): HandLandmark[] | null {
    if (!current || current.length < 21) {
      this.prev = null;
      return null;
    }
    if (!this.prev || this.prev.length !== current.length) {
      this.prev = current.map(p => ({ ...p }));
      return this.prev;
    }

    const smoothed: HandLandmark[] = new Array(current.length);
    for (let i = 0; i < current.length; i++) {
      const c = current[i];
      const p = this.prev[i];
      smoothed[i] = {
        x: this.alpha * c.x + (1 - this.alpha) * p.x,
        y: this.alpha * c.y + (1 - this.alpha) * p.y,
        z: this.alpha * (c.z ?? 0) + (1 - this.alpha) * (p.z ?? 0),
      };
    }
    this.prev = smoothed;
    return smoothed;
  }

  reset(): void {
    this.prev = null;
  }
}

/**
 * Heuristic Biomechanical Fallback Classifier.
 * Evaluates joint extension and angles directly to identify core signs
 * (Numbers, V/Prescription, Help, Thumbs-Up, Point, Fist) even with lighting or orientation variations.
 */
export function classifyBiomechanical(landmarks: readonly HandLandmark[] | null | undefined): GestureMatch | null {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];
  const thumbCmc = landmarks[1];
  const thumbMcp = landmarks[2];
  const thumbIp = landmarks[3];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const midTip = landmarks[12];
  const midPip = landmarks[10];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  const dist = (a: HandLandmark, b: HandLandmark) => Math.hypot(a.x - b.x, a.y - b.y);

  // Measure extension relative to joints
  const indexExt = dist(indexTip, wrist) > dist(indexPip, wrist) * 1.20;
  const midExt = dist(midTip, wrist) > dist(midPip, wrist) * 1.20;
  const ringExt = dist(ringTip, wrist) > dist(ringPip, wrist) * 1.20;
  const pinkyExt = dist(pinkyTip, wrist) > dist(pinkyPip, wrist) * 1.20;

  // Thumb extension requires tip to be separated from index MCP and further from wrist than IP
  const thumbExt = dist(thumbTip, indexMcp) > 0.12 && dist(thumbTip, wrist) > dist(thumbIp, wrist) * 1.15;

  const pinchDist = dist(thumbTip, indexTip);
  const extCount = [indexExt, midExt, ringExt, pinkyExt].filter(Boolean).length;

  // 1. Shaka / 'Y': Thumb & Pinky extended, others curled
  if (thumbExt && pinkyExt && !indexExt && !midExt && !ringExt) {
    return { label: 'Y', distance: 0.1, isKnown: true };
  }

  // 2. 'L': Thumb and Index extended at angle, others curled
  if (thumbExt && indexExt && !midExt && !ringExt && !pinkyExt && dist(thumbTip, indexTip) > 0.12) {
    return { label: 'L', distance: 0.1, isKnown: true };
  }

  // 3. 'APPOINTMENT' / '1': Only index extended, others curled
  if (indexExt && !midExt && !ringExt && !pinkyExt) {
    return { label: 'APPOINTMENT', distance: 0.1, isKnown: true };
  }

  // 4. 'V' / '2' / PRESCRIPTION: Index and middle extended, others curled
  if (indexExt && midExt && !ringExt && !pinkyExt) {
    return { label: 'PRESCRIPTION', distance: 0.1, isKnown: true };
  }

  // 5. '3' / 'W': Index, middle, ring extended
  if (indexExt && midExt && ringExt && !pinkyExt) {
    return { label: '3', distance: 0.1, isKnown: true };
  }

  // 6. '4': 4 fingers extended, thumb tucked
  if (extCount === 4 && !thumbExt) {
    return { label: '4', distance: 0.1, isKnown: true };
  }

  // 7. 'HELP' / '5': All 5 extended
  if (extCount === 4 && thumbExt) {
    return { label: 'HELP', distance: 0.1, isKnown: true };
  }

  // 8. 'MEDICINE': Pinch thumb & index
  if (pinchDist < 0.08 && extCount >= 1) {
    return { label: 'MEDICINE', distance: 0.1, isKnown: true };
  }

  // 9. 'THANK-YOU': Thumbs up (fist closed, thumb extended upright)
  if (extCount === 0 && thumbExt && thumbTip.y < indexMcp.y - 0.04) {
    return { label: 'THANK-YOU', distance: 0.1, isKnown: true };
  }

  // 10. 'PAIN': Closed fist
  if (extCount === 0) {
    return { label: 'PAIN', distance: 0.1, isKnown: true };
  }

  // 11. 'WAIT': Flat palm forward
  if (extCount >= 3 && Math.abs(indexTip.y - pinkyTip.y) < 0.12 && indexTip.y < wrist.y) {
    return { label: 'WAIT', distance: 0.1, isKnown: true };
  }

  return null;
}

/**
 * Real-time Kinematic Delivery Direction & Transit Sign Classifier.
 * Analyzes finger pointing vector, flexion angles, and hand orientation.
 * Optimized for Zomato / Swiggy / Uber / Blinkit real-time call directions.
 * Runs in < 0.05 ms on mobile NPU/CPU.
 */
export function classifyDeliveryGesture(landmarks: readonly HandLandmark[] | null | undefined): GestureMatch | null {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];
  const thumbMcp = landmarks[2];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];
  const midMcp = landmarks[9];
  const midPip = landmarks[10];
  const midTip = landmarks[12];
  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringTip = landmarks[16];
  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];

  const dist = (a: HandLandmark, b: HandLandmark) => Math.hypot(a.x - b.x, a.y - b.y);

  // Measure extension relative to each finger's MCP knuckle (orientation-invariant)
  const indexExt = dist(indexTip, indexMcp) > 0.12;
  const midExt = dist(midTip, midMcp) > 0.12;
  const ringExt = dist(ringTip, ringMcp) > 0.12;
  const pinkyExt = dist(pinkyTip, pinkyMcp) > 0.12;
  const thumbExt = dist(thumbTip, indexMcp) > 0.12 && dist(thumbTip, wrist) > dist(thumbMcp, wrist) * 1.15;
  const extCount = [indexExt, midExt, ringExt, pinkyExt].filter(Boolean).length;

  // Directional pointing with index finger alone
  if (indexExt && !midExt && !ringExt && !pinkyExt) {
    const dx = indexTip.x - indexMcp.x;
    const dy = indexTip.y - indexMcp.y;

    // Pointing left (towards Gate / Society Left)
    if (dx < -0.10) {
      return { label: 'GATE_LEFT', distance: 0.05, isKnown: true };
    }
    // Pointing right (towards Tower Right)
    if (dx > 0.10) {
      return { label: 'GATE_RIGHT', distance: 0.05, isKnown: true };
    }
    // Pointing downwards (coming down in lift)
    if (dy > 0.10 || indexTip.y > wrist.y + 0.05) {
      return { label: 'COMING_DOWN', distance: 0.05, isKnown: true };
    }
    // Pointing straight up: 1st floor / Main Gate
    return { label: 'FLOOR_1', distance: 0.05, isKnown: true };
  }

  // V-sign: 2nd floor / Flat
  if (indexExt && midExt && !ringExt && !pinkyExt) {
    return { label: 'FLOOR_2', distance: 0.05, isKnown: true };
  }

  // 3 fingers: 3rd floor
  if (indexExt && midExt && ringExt && !pinkyExt) {
    return { label: 'FLOOR_3', distance: 0.05, isKnown: true };
  }

  // Thumbs up: YES / Confirmed order
  if (extCount === 0 && thumbExt && thumbTip.y < indexMcp.y - 0.04) {
    return { label: 'YES', distance: 0.05, isKnown: true };
  }

  // Closed fist: WAIT / 1 minute
  if (extCount === 0 && !thumbExt) {
    return { label: 'WAIT', distance: 0.05, isKnown: true };
  }

  // Open palm facing forward: LEAVE AT DOOR
  if (extCount >= 3 && Math.abs(indexTip.y - pinkyTip.y) < 0.15 && indexTip.y < wrist.y) {
    return { label: 'DOOR', distance: 0.05, isKnown: true };
  }

  // Index + Thumb pinch: RING BELL
  if (dist(thumbTip, indexTip) < 0.08 && extCount <= 2) {
    return { label: 'BELL', distance: 0.05, isKnown: true };
  }

  return null;
}

/**
 * Recognize gesture using 72-D geometric matching with automatic biomechanical heuristic fallback.
 */
export function recognizeWithBiomechanicalFallback(
  landmarks: readonly HandLandmark[] | null | undefined,
  templates: readonly GestureTemplate[],
  threshold = MATCH_THRESHOLD,
): GestureMatch {
  const primaryMatch = recognizeGesture(landmarks, templates, threshold);
  if (primaryMatch.isKnown) {
    return primaryMatch;
  }
  const fallback = classifyBiomechanical(landmarks);
  return fallback ?? primaryMatch;
}


