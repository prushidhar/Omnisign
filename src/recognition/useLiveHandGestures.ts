import { useEffect, useRef, useState } from 'react';
import { useFrameProcessor, VisionCameraProxy, type Frame } from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import { LandmarkSmoother, recognizeGesture } from './gestureEngine';
import { loadTemplates } from './templateStore';
import type { GestureMatch, GestureTemplate, HandLandmark } from './types';

// Initialize native VisionCamera MediaPipe frame processor plugin
const plugin = VisionCameraProxy.initFrameProcessorPlugin('detectHandLandmarks', {});

export interface LiveHandGestures {
  frameProcessor: ReturnType<typeof useFrameProcessor>;
  match: GestureMatch | null;
  landmarks: HandLandmark[] | null;
  holdProgress: number;
}

const HOLD_REQUIRED_FRAMES = 15; // ~0.5s of steady hold to confirm

export function useLiveHandGestures(): LiveHandGestures {
  const [match, setMatch] = useState<GestureMatch | null>(null);
  const [landmarks, setLandmarks] = useState<HandLandmark[] | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);

  const smootherRef = useRef(new LandmarkSmoother(0.65));
  const templatesRef = useRef<GestureTemplate[]>([]);
  const currentLabelRef = useRef<string | null>(null);
  const holdCountRef = useRef(0);

  useEffect(() => {
    loadTemplates().then(t => {
      templatesRef.current = t;
    });
  }, []);

  const handleLandmarks = useRunOnJS((frameLandmarks: HandLandmark[] | null) => {
    if (!frameLandmarks || frameLandmarks.length < 21) {
      smootherRef.current.reset();
      setLandmarks(null);
      setMatch(null);
      holdCountRef.current = 0;
      setHoldProgress(0);
      return;
    }

    // Apply temporal EMA smoothing to filter micro-jitter
    const smoothed = smootherRef.current.smooth(frameLandmarks) ?? frameLandmarks;
    setLandmarks(smoothed);

    // Match smoothed landmarks against templates
    const m = recognizeGesture(smoothed, templatesRef.current);
    setMatch(m);

    // Track hold duration
    if (m.isKnown) {
      if (currentLabelRef.current === m.label) {
        holdCountRef.current += 1;
      } else {
        currentLabelRef.current = m.label;
        holdCountRef.current = 1;
      }
      setHoldProgress(Math.min(1.0, holdCountRef.current / HOLD_REQUIRED_FRAMES));
    } else {
      currentLabelRef.current = null;
      holdCountRef.current = 0;
      setHoldProgress(0);
    }
  }, []);

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';
      if (!plugin) return;
      try {
        const frameLandmarks = plugin.call(frame) as HandLandmark[] | null | undefined;
        handleLandmarks(frameLandmarks ?? null);
      } catch {
        handleLandmarks(null);
      }
    },
    [handleLandmarks],
  );

  return { frameProcessor, match, landmarks, holdProgress };
}
