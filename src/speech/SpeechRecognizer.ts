/**
 * SpeechRecognizer.ts
 * Wraps @react-native-voice/voice for clerk speech-to-text.
 * Uses Android's built-in ASR — zero model files, zero sideloading.
 * Falls back gracefully if Voice is unavailable.
 */
import Voice from '@react-native-voice/voice';

export type SpeechState = 'idle' | 'listening' | 'processing' | 'error';

type TranscriptCallback = (text: string, isFinal: boolean) => void;
type StateCallback = (state: SpeechState) => void;

class SpeechRecognizerImpl {
  private transcriptCb: TranscriptCallback | null = null;
  private stateCb: StateCallback | null = null;
  private _state: SpeechState = 'idle';
  private initialized = false;

  private init() {
    if (this.initialized) return;
    this.initialized = true;

    Voice.onSpeechStart = () => this.setStateInternal('listening');
    Voice.onSpeechEnd = () => this.setStateInternal('processing');
    Voice.onSpeechError = () => this.setStateInternal('error');

    Voice.onSpeechPartialResults = (e: any) => {
      const text = e?.value?.[0];
      if (text && this.transcriptCb) this.transcriptCb(text, false);
    };

    Voice.onSpeechResults = (e: any) => {
      const text = e?.value?.[0];
      if (text && this.transcriptCb) this.transcriptCb(text, true);
      this.setStateInternal('idle');
    };
  }

  private setStateInternal(s: SpeechState) {
    this._state = s;
    this.stateCb?.(s);
  }

  get state(): SpeechState { return this._state; }

  setCallbacks(onTranscript: TranscriptCallback, onState: StateCallback) {
    this.transcriptCb = onTranscript;
    this.stateCb = onState;
  }

  async startListening(): Promise<void> {
    this.init();
    try {
      await Voice.start('en-IN');
    } catch (err) {
      console.error('[SpeechRecognizer] start error:', err);
      this.setStateInternal('error');
    }
  }

  async stopListening(): Promise<void> {
    try { await Voice.stop(); } catch {}
  }

  async destroy(): Promise<void> {
    try { await Voice.destroy(); } catch {}
    this.initialized = false;
  }
}

export const SpeechRecognizer = new SpeechRecognizerImpl();
