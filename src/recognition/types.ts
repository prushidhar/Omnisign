export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureTemplate {
  label: string;
  features: number[];
}

export interface GestureMatch {
  label: string;
  distance: number;
  isKnown: boolean;
}

export const FEATURE_VECTOR_LENGTH = 72; // 21 landmarks × 3 + 9 geometry pairs

export type CaptureRejectReason = 'no-hand' | 'too-far' | 'unstable';

export type SaveDecision =
  | { kind: 'save' }
  | { kind: 'label-collision'; existing: GestureTemplate };

export interface GestureTemplateFile {
  schema: string;
  created_at: string;
  description: string;
  gestures: GestureTemplate[];
}
