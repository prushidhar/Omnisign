/**
 * useSpeech.ts
 * React hook for clerk speech recognition.
 * Manages continuous listening mode with auto-restart.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeechRecognizer, type SpeechState } from './SpeechRecognizer';
import Tts from 'react-native-tts';

export interface SpeechHook {
  speechState: SpeechState;
  /** Final clerk utterances as they complete. */
  clerkLines: string[];
  /** Live partial text being spoken right now. */
  partialText: string;
  startClerkListening: () => Promise<void>;
  stopClerkListening: () => Promise<void>;
  /** Speak a confirmed citizen sentence. Pauses mic while speaking to avoid feedback. */
  speakCitizen: (text: string) => Promise<void>;
  isSpeaking: boolean;
}

export function useSpeech(): SpeechHook {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [clerkLines, setClerkLines] = useState<string[]>([]);
  const [partialText, setPartialText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const listeningRef = useRef(false);

  useEffect(() => {
    SpeechRecognizer.setCallbacks(
      (text, isFinal) => {
        if (isFinal) {
          setClerkLines(prev => [...prev, text]);
          setPartialText('');
          // Auto-restart listening after a final result if still enabled
          if (listeningRef.current) {
            SpeechRecognizer.startListening().catch(() => {});
          }
        } else {
          setPartialText(text);
        }
      },
      (state) => setSpeechState(state),
    );

    const onStart = () => setIsSpeaking(true);
    const onFinish = () => {
      setIsSpeaking(false);
      if (listeningRef.current) {
        SpeechRecognizer.startListening().catch(() => {});
      }
    };
    const onCancel = () => setIsSpeaking(false);

    Tts.addEventListener('tts-start', onStart);
    Tts.addEventListener('tts-finish', onFinish);
    Tts.addEventListener('tts-cancel', onCancel);

    return () => {
      SpeechRecognizer.destroy();
    };
  }, []);

  const startClerkListening = useCallback(async () => {
    listeningRef.current = true;
    await SpeechRecognizer.startListening();
  }, []);

  const stopClerkListening = useCallback(async () => {
    listeningRef.current = false;
    await SpeechRecognizer.stopListening();
  }, []);

  const speakCitizen = useCallback(async (text: string) => {
    // Pause mic while TTS speaks to avoid self-transcription
    if (listeningRef.current) {
      await SpeechRecognizer.stopListening();
    }
    Tts.stop();
    await new Promise<void>(resolve => {
      let cleaned = false;
      const cleanup = () => {
        if (!cleaned) {
          cleaned = true;
          resolve();
        }
      };
      let subFinish: any;
      let subCancel: any;
      subFinish = (Tts as any).addEventListener('tts-finish', () => {
        try { subFinish?.remove?.(); } catch {}
        try { subCancel?.remove?.(); } catch {}
        cleanup();
      });
      subCancel = (Tts as any).addEventListener('tts-cancel', () => {
        try { subFinish?.remove?.(); } catch {}
        try { subCancel?.remove?.(); } catch {}
        cleanup();
      });
      Tts.speak(text);
    });
  }, []);

  return { speechState, clerkLines, partialText, startClerkListening, stopClerkListening, speakCitizen, isSpeaking };
}
