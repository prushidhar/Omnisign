/**
 * src/components/SignGuideCircle.tsx
 * Reusable animated circular viewfinder HUD for sign placement and hold-to-confirm progress.
 * Built with standard React Native Animated for zero-dependency portability and high performance.
 */

import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';

export const HOLD_MS = 1000;
export const COOLDOWN_MS = 1200;

export interface SignGuideCircleProps {
  /** Whether a hand is actively detected within the viewfinder zone */
  active: boolean;
  /** Diameter of the viewfinder circle in dp */
  size?: number;
  /** Active label being recognized (if any) */
  currentSign?: string;
  /** Callback fired when hold completes without early abortion */
  onComplete: () => void;
}

export function SignGuideCircle({
  active,
  size = 260,
  currentSign,
  onComplete,
}: SignGuideCircleProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [isHolding, setIsHolding] = useState(false);
  const runningRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const activeRef = useRef(active);
  activeRef.current = active;
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active || runningRef.current) return;

    const startHold = () => {
      runningRef.current = true;
      setIsHolding(true);
      progress.setValue(0);

      Animated.timing(progress, {
        toValue: 1,
        duration: HOLD_MS,
        useNativeDriver: false,
      }).start(({ finished }) => {
        runningRef.current = false;
        setIsHolding(false);
        progress.setValue(0);

        if (finished) {
          onCompleteRef.current();
        }

        cooldownTimer.current = setTimeout(() => {
          if (activeRef.current && !runningRef.current) {
            startHold();
          }
        }, COOLDOWN_MS);
      });
    };

    startHold();

    return () => {
      if (cooldownTimer.current) {
        clearTimeout(cooldownTimer.current);
      }
    };
  }, [active, progress]);

  const progressPercent = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      {/* Outer Guide Ring */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: active ? '#10B981' : 'rgba(255,255,255,0.3)',
          },
        ]}
      />

      {/* Progress Track at bottom of HUD */}
      {isHolding ? (
        <View style={[styles.progressTrack, { width: size * 0.7 }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressPercent,
                backgroundColor: '#10B981',
              },
            ]}
          />
        </View>
      ) : null}

      {/* Center Feedback */}
      <View style={styles.centerBadge}>
        {currentSign && currentSign !== 'UNKNOWN' ? (
          <View style={styles.signPill}>
            <Text style={styles.signText}>{currentSign}</Text>
          </View>
        ) : (
          <Text style={styles.hintText}>
            {active ? 'Hold hand steady...' : 'Place hand in circle'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3.5,
    borderStyle: 'dashed',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 24,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  centerBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  signPill: {
    backgroundColor: 'rgba(16,185,129,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  signText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 1,
  },
  hintText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(15,23,42,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
