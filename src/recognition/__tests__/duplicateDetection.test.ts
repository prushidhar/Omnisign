import { normalizeLabel, classifyGestureSave } from '../duplicateDetection';
import type { GestureTemplate } from '../types';

describe('duplicateDetection (OmniSign collision resolver)', () => {
  const dummyFeatures = new Array(72).fill(0.1);

  const bundledTemplates: GestureTemplate[] = [
    { label: 'HELP', features: dummyFeatures },
    { label: 'MEDICINE', features: dummyFeatures },
    { label: 'DOCTOR', features: dummyFeatures },
  ];

  const userTemplates: GestureTemplate[] = [
    { label: 'CUSTOM_SIGN', features: dummyFeatures },
    { label: 'DOCTOR', features: dummyFeatures }, // Shadows bundled DOCTOR
  ];

  describe('normalizeLabel', () => {
    it('trims leading/trailing whitespace and converts to uppercase', () => {
      expect(normalizeLabel('help')).toBe('HELP');
      expect(normalizeLabel('  medicine  ')).toBe('MEDICINE');
      expect(normalizeLabel('Doctor_Token ')).toBe('DOCTOR_TOKEN');
    });
  });

  describe('classifyGestureSave', () => {
    it('allows clean save for an entirely new label', () => {
      const decision = classifyGestureSave(userTemplates, bundledTemplates, 'NEW_GESTURE');
      expect(decision).toEqual({ kind: 'save' });
    });

    it('identifies collision with custom user gestures first', () => {
      const decision = classifyGestureSave(userTemplates, bundledTemplates, 'custom_sign');
      expect(decision.kind).toBe('label-collision');
      if (decision.kind === 'label-collision') {
        expect(decision.existing.label).toBe('CUSTOM_SIGN');
      }
    });

    it('prioritizes user custom template over bundled template on shadowed label', () => {
      const decision = classifyGestureSave(userTemplates, bundledTemplates, 'doctor');
      expect(decision.kind).toBe('label-collision');
      if (decision.kind === 'label-collision') {
        // Must point to the user's template instance
        expect(decision.existing).toBe(userTemplates[1]);
      }
    });

    it('identifies collision with bundled template when not shadowed by user', () => {
      const decision = classifyGestureSave(userTemplates, bundledTemplates, '  help ');
      expect(decision.kind).toBe('label-collision');
      if (decision.kind === 'label-collision') {
        expect(decision.existing.label).toBe('HELP');
      }
    });
  });
});
