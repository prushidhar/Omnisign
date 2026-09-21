/**
 * App.tsx — OmniSign root
 * Boots the WebSocket bridge server and renders navigation.
 */
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Tts from 'react-native-tts';

import { SetupScreen } from './src/screens/SetupScreen';
import { CounterScreen } from './src/screens/CounterScreen';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Boot TTS once
async function initTts() {
  try {
    await Tts.setDefaultLanguage('en-IN');
    await Tts.setDefaultRate(0.47);
    await Tts.setDefaultPitch(1.0);
    // Prefer neural voice
    const voices = await Tts.voices();
    const best = voices?.find((v: any) =>
      v.language?.startsWith('en') &&
      (v.quality === 500 || v.name?.toLowerCase().includes('neural') || v.name?.toLowerCase().includes('enhanced'))
    );
    if (best?.id) await Tts.setDefaultVoice(best.id);
  } catch { /* non-fatal */ }
}

export default function App() {
  useEffect(() => {
    initTts();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Setup"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: '#0D0D0D' },
          }}
        >
          <Stack.Screen name="Setup"   component={SetupScreen} />
          <Stack.Screen name="Counter" component={CounterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
