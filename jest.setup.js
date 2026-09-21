/* eslint-env jest */
// Native modules mock for Jest test environment

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 44, bottom: 24, left: 0, right: 0 }),
  };
});

jest.mock('react-native-screens', () => require('react-native-screens/mock'));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock-documents',
  exists: jest.fn(async () => false),
  readFile: jest.fn(async () => '[]'),
  writeFile: jest.fn(async () => undefined),
  unlink: jest.fn(async () => undefined),
  moveFile: jest.fn(async () => undefined),
}));

jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  return {
    Camera: {
      getCameraPermissionStatus: () => 'denied',
      requestCameraPermission: async () => 'denied',
      getAvailableCameraDevices: () => [],
    },
    useFrameProcessor: (worklet, deps) => React.useCallback(worklet, deps),
    VisionCameraProxy: { initFrameProcessorPlugin: () => null },
  };
});

jest.mock('react-native-worklets-core', () => {
  const React = require('react');
  return {
    useRunOnJS: (callback, deps) =>
      React.useCallback((...args) => Promise.resolve(callback(...args)), deps),
  };
});

jest.mock('react-native-tts', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  setDefaultLanguage: jest.fn(),
  setDefaultRate: jest.fn(),
}));

jest.mock('@react-native-voice/voice', () => ({
  onSpeechStart: jest.fn(),
  onSpeechRecognized: jest.fn(),
  onSpeechEnd: jest.fn(),
  onSpeechError: jest.fn(),
  onSpeechResults: jest.fn(),
  start: jest.fn(async () => undefined),
  stop: jest.fn(async () => undefined),
  destroy: jest.fn(async () => undefined),
  removeAllListeners: jest.fn(),
}));
