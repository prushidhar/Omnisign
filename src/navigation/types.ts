/**
 * navigation/types.ts
 * React Navigation type definitions for OmniSign.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type Scenario = 'hospital' | 'bank' | 'general';

export type RootStackParamList = {
  Setup: undefined;
  Counter: { scenario: Scenario };
  AddSign: { label?: string };
};

export type SetupScreenProps = NativeStackScreenProps<RootStackParamList, 'Setup'>;
export type CounterScreenProps = NativeStackScreenProps<RootStackParamList, 'Counter'>;
export type AddSignScreenProps = NativeStackScreenProps<RootStackParamList, 'AddSign'>;
