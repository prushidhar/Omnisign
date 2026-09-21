/**
 * duplicateDetection.ts
 * Manages collision resolution and label normalization for OmniSign gesture templates.
 */

import type { GestureTemplate, SaveDecision } from './types';

/**
 * Trims and uppercase-folds a label for invariant comparison.
 * Ensures "help", " HELP ", and "Help" refer to the same gesture.
 */
export function normalizeLabel(label: string): string {
  return label.trim().toUpperCase();
}

/**
 * Classifies a prospective gesture save action.
 * Priority rules:
 * 1. Checks user's custom templates first: an existing custom sign with this name
 *    wins over a bundled one (it is what is actively shadowed).
 * 2. Checks bundled templates second: collisions require confirmation before shadowing.
 * 3. If neither matches, returns { kind: 'save' }, safe to persist immediately.
 */
export function classifyGestureSave(
  userTemplates: readonly GestureTemplate[],
  bundledTemplates: readonly GestureTemplate[],
  label: string,
): SaveDecision {
  const normalized = normalizeLabel(label);
  const userMatch = userTemplates.find(
    template => normalizeLabel(template.label) === normalized,
  );
  if (userMatch) {
    return { kind: 'label-collision', existing: userMatch };
  }

  const bundledMatch = bundledTemplates.find(
    template => normalizeLabel(template.label) === normalized,
  );
  if (bundledMatch) {
    return { kind: 'label-collision', existing: bundledMatch };
  }

  return { kind: 'save' };
}
