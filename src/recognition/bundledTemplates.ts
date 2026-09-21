import type { GestureTemplate } from './types';

// Bundled calibrated 72-D spatial feature vectors for public counter ISL
// eslint-disable-next-line @typescript-eslint/no-var-requires
const raw: any = require('../assets/counter_isl_vocab.json');

export const BUNDLED_TEMPLATES: GestureTemplate[] = Array.isArray(raw?.gestures)
  ? raw.gestures.map((g: any) => ({
      label: g.label,
      features: g.features,
    }))
  : [];
