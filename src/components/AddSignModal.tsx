/**
 * src/components/AddSignModal.tsx
 * Dialog allowing Deaf citizens to calibrate and enroll a new custom sign right at the desk.
 */

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { classifyGestureSave } from '../recognition/duplicateDetection';
import { assessCapture, CAPTURE_REJECT_MESSAGES } from '../recognition/captureQuality';
import type { HandLandmark, GestureTemplate } from '../recognition/types';

export interface AddSignModalProps {
  visible: boolean;
  userTemplates: readonly GestureTemplate[];
  bundledTemplates: readonly GestureTemplate[];
  currentLandmarks: readonly HandLandmark[] | null;
  landmarkHistory: ReadonlyArray<readonly HandLandmark[]>;
  onSave: (label: string, landmarks: readonly HandLandmark[]) => Promise<void>;
  onClose: () => void;
}

export function AddSignModal({
  visible,
  userTemplates,
  bundledTemplates,
  currentLandmarks,
  landmarkHistory,
  onSave,
  onClose,
}: AddSignModalProps) {
  const [label, setLabel] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [collisionTarget, setCollisionTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCaptureAndSave = async () => {
    const trimmed = label.trim().toUpperCase();
    if (!trimmed) {
      setErrorMsg('Please enter a name for this sign.');
      return;
    }

    // 1. Quality gate check
    const rejectReason = assessCapture(currentLandmarks, landmarkHistory);
    if (rejectReason) {
      setErrorMsg(CAPTURE_REJECT_MESSAGES[rejectReason]);
      return;
    }

    // 2. Collision check
    if (!collisionTarget) {
      const decision = classifyGestureSave(userTemplates, bundledTemplates, trimmed);
      if (decision.kind === 'label-collision') {
        setCollisionTarget(decision.existing.label);
        setErrorMsg(`"${decision.existing.label}" already exists. Tap again to overwrite.`);
        return;
      }
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      await onSave(trimmed, currentLandmarks!);
      setLabel('');
      setCollisionTarget(null);
      onClose();
    } catch {
      setErrorMsg('Failed to save sign to local storage.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLabel('');
    setErrorMsg(null);
    setCollisionTarget(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Calibrate New Sign</Text>
          <Text style={styles.subtitle}>
            Hold your hand pose in view of the camera and enter a sign label.
          </Text>

          <Text style={styles.inputLabel}>Sign Label (e.g. BLOOD_TEST)</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={text => {
              setLabel(text);
              setErrorMsg(null);
              setCollisionTarget(null);
            }}
            placeholder="ENTER_SIGN_NAME"
            placeholderTextColor="#64748B"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                collisionTarget ? styles.overwriteButton : styles.saveButton,
              ]}
              onPress={handleCaptureAndSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>
                {saving
                  ? 'Saving...'
                  : collisionTarget
                  ? 'Confirm Overwrite'
                  : 'Capture & Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  cancelText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  overwriteButton: {
    backgroundColor: '#F59E0B',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
