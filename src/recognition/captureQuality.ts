/**
 * captureQuality.ts
 * Quality gating engine for gesture captures in OmniSign.
 * Gates a capture before it is accepted for matching or calibration:
 * 1. Checks landmark validity (exactly 21 finite coordinate points).
 * 2. Checks hand-to-camera distance (handSpread across raw frame coordinates).
 * 3. Checks hand steadiness over the hold window (maxJitter across consecutive samples).
 */

import type { HandLandmark, CaptureRejectReason } from './types';

/** MediaPipe Hands' fixed single-hand landmark count. */
export const REQUIRED_LANDMARK_COUNT = 21;

/**
 * True only for a plausible single-hand MediaPipe result:
 * exactly 21 points, with finite numeric x, y, and z values.
 */
export function isValidLandmarks(
  landmarks: readonly HandLandmark[] | null | undefined,
): landmarks is HandLandmark[] {
  if (!landmarks || landmarks.length !== REQUIRED_LANDMARK_COUNT) return false;
  return landmarks.every(
    point =>
      typeof point?.x === 'number' &&
      typeof point.y === 'number' &&
      typeof point.z === 'number' &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      Number.isFinite(point.z),
  );
}

/**
 * Bounding-box diagonal across raw frame coordinates [0, 1].
 * Small spread indicates hand is too far from the camera lens.
 */
export function handSpread(landmarks: readonly HandLandmark[]): number {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of landmarks) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  return Math.hypot(maxX - minX, maxY - minY);
}

/** Minimum frame-relative bounding box diagonal required for stable capture. */
export const MIN_HAND_SPREAD = 0.15;

/**
 * Largest single-landmark displacement between any two consecutive samples
 * in the hold window. Used to filter out jitter, motion blur, and mid-transition poses.
 */
export function maxJitter(samples: ReadonlyArray<readonly HandLandmark[]>): number {
  let max = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1];
    const current = samples[i];
    if (previous.length !== current.length) continue;
    for (let index = 0; index < current.length; index += 1) {
      const distance = Math.hypot(
        current[index].x - previous[index].x,
        current[index].y - previous[index].y,
        current[index].z - previous[index].z,
      );
      if (distance > max) max = distance;
    }
  }
  return max;
}

/** Maximum allowed frame-to-frame landmark jitter during hold-to-confirm. */
export const MAX_JITTER = 0.08;

export const CAPTURE_REJECT_MESSAGES: Record<CaptureRejectReason, string> = {
  'no-hand': 'Hand not detected in frame',
  'too-far': 'Move your hand closer to the camera',
  unstable: 'Hold your hand steady inside the guide circle',
};

/**
 * Assesses whether a completed hold satisfies quality requirements.
 * Evaluates priority order:
 * 1. Is hand present and structurally valid? ('no-hand')
 * 2. Is hand sufficiently large in the camera viewport? ('too-far')
 * 3. Is hand steady across the sample window? ('unstable')
 * Returns null when capture passes all checks.
 */
export function assessCapture(
  landmarks: readonly HandLandmark[] | null | undefined,
  samples: ReadonlyArray<readonly HandLandmark[]>,
): CaptureRejectReason | null {
  if (!isValidLandmarks(landmarks)) return 'no-hand';
  if (handSpread(landmarks) < MIN_HAND_SPREAD) return 'too-far';
  if (maxJitter(samples) > MAX_JITTER) return 'unstable';
  return null;
}
