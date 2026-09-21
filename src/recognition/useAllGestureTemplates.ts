/**
 * useAllGestureTemplates.ts
 * React hook providing the unified active lexicon of gesture templates in OmniSign:
 * combines bundled ISL counter signs (A-Z fingerspelling + civic signs)
 * with user-calibrated gestures, guaranteeing atomic persistence and serialized saves.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BUNDLED_TEMPLATES } from './bundledTemplates';
import { normalizeLabel } from './duplicateDetection';
import {
  loadUserGestures,
  saveUserGestures,
  subscribeUserGesturesChanged,
  upsertUserGesture,
  clearUserGestures,
} from './userGestureStore';
import type { GestureTemplate } from './types';

export interface AllGestureTemplates {
  /** All active templates: bundled vocabulary plus user-calibrated gestures (user signs shadow bundled). */
  templates: GestureTemplate[];
  /** User-calibrated custom templates only. */
  userTemplates: GestureTemplate[];
  /** Loading state while reading initial templates from storage. */
  loading: boolean;
  /** Thread-safe serialized add or update of a gesture template. */
  addOrUpdate: (template: GestureTemplate) => Promise<void>;
  /** Safely clears all user-calibrated gestures. */
  clearAll: () => Promise<void>;
}

export function useAllGestureTemplates(): AllGestureTemplates {
  const [userTemplates, setUserTemplates] = useState<GestureTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const userTemplatesRef = useRef<GestureTemplate[]>(userTemplates);
  useEffect(() => {
    userTemplatesRef.current = userTemplates;
  }, [userTemplates]);

  // Serialized save queue prevents race conditions or half-written states
  const pendingSave = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadUserGestures();
      if (!cancelled) {
        setUserTemplates(loaded);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeUserGesturesChanged(() => {
      loadUserGestures().then(loaded => {
        userTemplatesRef.current = loaded;
        setUserTemplates(loaded);
      });
    });
  }, []);

  const addOrUpdate = useCallback((template: GestureTemplate) => {
    const run = pendingSave.current.then(async () => {
      const next = upsertUserGesture(userTemplatesRef.current, template);
      await saveUserGestures(next);
      userTemplatesRef.current = next;
      setUserTemplates(next);
    });
    pendingSave.current = run.catch(() => undefined);
    return run;
  }, []);

  const clearAll = useCallback(() => {
    const run = pendingSave.current.then(async () => {
      await clearUserGestures();
      userTemplatesRef.current = [];
      setUserTemplates([]);
    });
    pendingSave.current = run.catch(() => undefined);
    return run;
  }, []);

  const templates = useMemo(() => {
    const userLabels = new Set(
      userTemplates.map(template => normalizeLabel(template.label)),
    );
    const bundledMinusOverridden = BUNDLED_TEMPLATES.filter(
      template => !userLabels.has(normalizeLabel(template.label)),
    );
    return [...bundledMinusOverridden, ...userTemplates];
  }, [userTemplates]);

  return { templates, userTemplates, loading, addOrUpdate, clearAll };
}
