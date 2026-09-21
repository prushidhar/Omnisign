/**
 * src/components/CounterStatusBar.tsx
 * Professional accessibility status bar for the OmniSign public counter terminal.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export interface CounterStatusBarProps {
  scenario: 'hospital' | 'bank' | 'general';
  isListening: boolean;
  handDetected: boolean;
  fps?: number;
}

export function CounterStatusBar({
  scenario,
  isListening,
  handDetected,
  fps = 30,
}: CounterStatusBarProps) {
  const scenarioLabels = {
    hospital: 'HOSPITAL OPD TRIAGE',
    bank: 'BANK SERVICE DESK',
    general: 'CIVIC REGISTRY DESK',
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={styles.scenarioBadge}>
          <Text style={styles.scenarioText}>{scenarioLabels[scenario]}</Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        {/* Hand Landmark Status */}
        <View style={[styles.statusPill, handDetected ? styles.pillActive : styles.pillInactive]}>
          <View style={[styles.dot, handDetected ? styles.dotGreen : styles.dotGray]} />
          <Text style={styles.pillText}>{handDetected ? 'HAND IN-FRAME' : 'NO HAND'}</Text>
        </View>

        {/* Continuous Mic ASR Status */}
        <View style={[styles.statusPill, isListening ? styles.pillActive : styles.pillInactive]}>
          <View style={[styles.dot, isListening ? styles.dotBlue : styles.dotGray]} />
          <Text style={styles.pillText}>{isListening ? 'MIC ACTIVE' : 'MIC IDLE'}</Text>
        </View>

        {/* Engine FPS */}
        <View style={styles.fpsPill}>
          <Text style={styles.fpsText}>{fps} FPS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scenarioBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scenarioText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  pillActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pillInactive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotBlue: {
    backgroundColor: '#38BDF8',
  },
  dotGray: {
    backgroundColor: '#64748B',
  },
  pillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fpsPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  fpsText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
});
