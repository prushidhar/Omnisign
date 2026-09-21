/**
 * templateStore.ts
 * Persists user-recorded gesture templates to the device filesystem.
 * Uses react-native-fs for atomic writes.
 */
import RNFS from 'react-native-fs';
import type { GestureTemplate } from './types';
import { BUNDLED_TEMPLATES } from './bundledTemplates';

const STORE_PATH = `${RNFS.DocumentDirectoryPath}/omnisign_gestures.json`;

let cache: GestureTemplate[] | null = null;
const listeners = new Set<() => void>();

export function onTemplatesChanged(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() { listeners.forEach(fn => fn()); }

export async function loadTemplates(): Promise<GestureTemplate[]> {
  if (cache) return cache;
  try {
    const exists = await RNFS.exists(STORE_PATH);
    let userList: GestureTemplate[] = [];
    if (exists) {
      const raw = await RNFS.readFile(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      userList = Array.isArray(parsed) ? parsed : [];
    }
    // Custom user templates override bundled templates with same label
    const map = new Map<string, GestureTemplate>();
    for (const t of BUNDLED_TEMPLATES) map.set(t.label, t);
    for (const t of userList) map.set(t.label, t);
    cache = Array.from(map.values());
    return cache;
  } catch {
    cache = [...BUNDLED_TEMPLATES];
    return cache;
  }
}

export async function saveTemplate(template: GestureTemplate): Promise<void> {
  const templates = await loadTemplates();
  const idx = templates.findIndex(t => t.label === template.label);
  if (idx >= 0) { templates[idx] = template; } else { templates.push(template); }
  cache = templates;
  const tmp = `${STORE_PATH}.tmp`;
  await RNFS.writeFile(tmp, JSON.stringify(templates), 'utf8');
  await RNFS.moveFile(tmp, STORE_PATH);
  notify();
}

export async function deleteTemplate(label: string): Promise<void> {
  const templates = await loadTemplates();
  cache = templates.filter(t => t.label !== label);
  await RNFS.writeFile(STORE_PATH, JSON.stringify(cache), 'utf8');
  notify();
}

export async function clearAll(): Promise<void> {
  cache = [];
  await RNFS.unlink(STORE_PATH).catch(() => {});
  notify();
}
