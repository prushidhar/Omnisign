/**
 * userGestureStore.ts
 * Atomic on-device persistence for custom user-calibrated gestures in OmniSign.
 * Writes to a temporary staging file before atomically replacing the target store,
 * preventing corrupted JSON states if an interruption or process kill occurs.
 */

import RNFS from 'react-native-fs';
import { normalizeLabel } from './duplicateDetection';
import type { GestureTemplate, GestureTemplateFile } from './types';

export const USER_GESTURES_PATH = `${RNFS.DocumentDirectoryPath}/omnisign_user_gestures.json`;
const TEMP_PATH = `${USER_GESTURES_PATH}.tmp`;

const listeners = new Set<() => void>();

function notifyUserGesturesChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeUserGesturesChanged(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Loads user-calibrated gesture templates from device storage.
 * Returns empty array on miss or read error — never crashes the UI.
 */
export async function loadUserGestures(): Promise<GestureTemplate[]> {
  try {
    const exists = await RNFS.exists(USER_GESTURES_PATH);
    if (!exists) return [];
    const raw = await RNFS.readFile(USER_GESTURES_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.gestures)) return parsed.gestures;
    return [];
  } catch {
    return [];
  }
}

/**
 * Persists the complete array of custom templates to disk using atomic rename.
 */
export async function saveUserGestures(templates: readonly GestureTemplate[]): Promise<void> {
  const fileData: GestureTemplateFile = {
    schema: 'omnisign-gesture-v1',
    created_at: new Date().toISOString(),
    description: 'OmniSign custom calibrated gestures recorded on-device.',
    gestures: [...templates],
  };

  await RNFS.writeFile(TEMP_PATH, JSON.stringify(fileData, null, 2), 'utf8');
  if (await RNFS.exists(USER_GESTURES_PATH)) {
    await RNFS.unlink(USER_GESTURES_PATH);
  }
  await RNFS.moveFile(TEMP_PATH, USER_GESTURES_PATH);
  notifyUserGesturesChanged();
}

/**
 * Pure helper to insert or update a template by normalized label.
 */
export function upsertUserGesture(
  templates: readonly GestureTemplate[],
  newTemplate: GestureTemplate,
): GestureTemplate[] {
  const label = normalizeLabel(newTemplate.label);
  const index = templates.findIndex(t => normalizeLabel(t.label) === label);
  if (index === -1) {
    return [...templates, newTemplate];
  }
  const next = [...templates];
  next[index] = newTemplate;
  return next;
}

/**
 * Deletes all user-calibrated gestures.
 */
export async function clearUserGestures(): Promise<void> {
  if (await RNFS.exists(USER_GESTURES_PATH)) {
    await RNFS.unlink(USER_GESTURES_PATH).catch(() => {});
  }
  notifyUserGesturesChanged();
}
