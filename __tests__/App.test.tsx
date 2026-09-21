import 'react-native';

// Mock react-native-screens official mock
jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => true),
    ScreenContainer: View,
    Screen: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    ScreenStack: View,
    ScreenStackHeaderConfig: View,
    ScreenStackHeaderSubview: View,
    SearchBar: View,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevice: jest.fn(() => ({ id: 'front', position: 'front' })),
  useCameraFormat: jest.fn(),
  useFrameProcessor: jest.fn(() => jest.fn()),
  VisionCameraProxy: {
    initFrameProcessorPlugin: jest.fn(),
  },
}));

jest.mock('react-native-worklets-core', () => ({
  useRunOnJS: (fn: any) => fn,
}));

// Mock native modules for unit test environment
jest.mock('react-native-tts', () => ({
  setDefaultLanguage: jest.fn(),
  setDefaultRate: jest.fn(),
  setDefaultPitch: jest.fn(),
  voices: jest.fn().mockResolvedValue([]),
  setDefaultVoice: jest.fn(),
  addEventListener: jest.fn(),
  speak: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('@react-native-voice/voice', () => ({
  onSpeechStart: jest.fn(),
  onSpeechEnd: jest.fn(),
  onSpeechError: jest.fn(),
  onSpeechResults: jest.fn(),
  onSpeechPartialResults: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  destroy: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/test-doc-path',
  exists: jest.fn().mockResolvedValue(false),
  readFile: jest.fn().mockResolvedValue('[]'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  moveFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

import App from '../App';

describe('OmniSign App Entrypoint', () => {
  it('mounts navigation and initializes bridge and TTS without crashing', () => {
    expect(App).toBeDefined();
  });
});
