/**
 * src/recognition/index.ts
 * Public entry point for OmniSign on-device gesture recognition pipeline.
 */

export {
  buildFeatureVector,
  featureDistance,
  recognizeGesture,
  createTemplate,
  MATCH_THRESHOLD,
  LandmarkSmoother,
  classifyBiomechanical,
  classifyDeliveryGesture,
  recognizeWithBiomechanicalFallback,
} from './gestureEngine';

export { BUNDLED_TEMPLATES } from './bundledTemplates';

export {
  REQUIRED_LANDMARK_COUNT,
  MIN_HAND_SPREAD,
  MAX_JITTER,
  CAPTURE_REJECT_MESSAGES,
  isValidLandmarks,
  handSpread,
  maxJitter,
  assessCapture,
} from './captureQuality';

export { normalizeLabel, classifyGestureSave } from './duplicateDetection';

export {
  USER_GESTURES_PATH,
  loadUserGestures,
  saveUserGestures,
  upsertUserGesture,
  clearUserGestures,
  subscribeUserGesturesChanged,
} from './userGestureStore';

export { useAllGestureTemplates } from './useAllGestureTemplates';
export type { AllGestureTemplates } from './useAllGestureTemplates';

export {
  loadTemplates,
  saveTemplate,
  deleteTemplate,
  onTemplatesChanged,
  clearAll,
} from './templateStore';

export { useLiveHandGestures } from './useLiveHandGestures';

export type {
  HandLandmark,
  GestureTemplate,
  GestureMatch,
  CaptureRejectReason,
  SaveDecision,
  GestureTemplateFile,
} from './types';

export { FEATURE_VECTOR_LENGTH } from './types';
