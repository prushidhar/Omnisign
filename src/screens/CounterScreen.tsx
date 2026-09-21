/**
 * screens/CounterScreen.tsx
 *
 * OmniSign's real-time, on-device two-way conversation screen.
 *
 * Layout:
 * ┌─────────────────────────────────────────┐
 * │  STATUS BAR  (Live status indicator)    │
 * ├─────────────────────────────────────────┤
 * │                                         │
 * │  REAL-TIME CAMERA (top ~55%)            │
 * │  • Front camera active                  │
 * │  • MediaPipe frame processor            │
 * │  • Live hand hold ring (0% -> 100%)     │
 * │  • Gloss tokens bar: [MEDICINE] [RX]    │
 * │  • Confirm gate: "I need my medication" │
 * │                                         │
 * ├─────────────────────────────────────────┤
 * │                                         │
 * │  LIVE TRANSCRIPT PANE (bottom ~35%)     │
 * │  • Deaf person reads hearing response   │
 * │  • Continuous mic speech-to-text        │
 * │                                         │
 * └─────────────────────────────────────────┘
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

import { useLiveHandGestures } from '../recognition';
import { useSpeech } from '../speech';
import { DialogueSynthesizer, type SupportedLanguage } from '../nlp';
import type { CounterScreenProps } from '../navigation/types';
import { MemoryLayer } from '../memory';

// ── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg:      '#0D0D0D',
  surface: '#1A1A1A',
  border:  '#2C2C2C',
  citizen: '#4F7BE8',
  clerk:   '#2EBE7B',
  danger:  '#E84F4F',
  warn:    '#E8A24F',
  text:    '#F0F0F0',
  muted:   '#777',
};

interface Line {
  id: number;
  who: 'citizen' | 'clerk';
  text: string;
  ts: number;
}

let lineId = 0;
const uid = () => ++lineId;

export function CounterScreen({ route, navigation }: CounterScreenProps) {
  const { scenario } = route.params;

  // ── Real-Time Camera & Vision ───────────────────────────────────────────────
  const device = useCameraDevice('front');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    Camera.requestCameraPermission().then(status => {
      setHasPermission(status === 'granted');
    });
  }, []);

  // Live hand detection hook (MediaPipe GPU frame processor)
  const { frameProcessor, match, holdProgress } = useLiveHandGestures();
  const lastConfirmedLabel = useRef<string | null>(null);

  // ── Conversation & Speech ───────────────────────────────────────────────────
  // ── Conversation & Speech ───────────────────────────────────────────────────
  const speech = useSpeech();
  const [language, setLanguage]         = useState<SupportedLanguage>('en');
  const [isEmergency, setIsEmergency]   = useState(false);
  const [glossTokens, setGlossTokens]   = useState<string[]>([]);
  const [candidates, setCandidates]     = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const genTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lines, setLines]               = useState<Line[]>([]);
  const scrollRef                       = useRef<ScrollView>(null);
  const [listeningActive, setListening] = useState(false);

  // ── Auto-confirm sign on complete steady hold ──────────────────────────────
  useEffect(() => {
    if (holdProgress >= 1.0 && match?.isKnown && match.label) {
      if (lastConfirmedLabel.current !== match.label) {
        lastConfirmedLabel.current = match.label;
        setGlossTokens(prev => [...prev, match.label]);
        setCandidates([]);
      }
    } else if (holdProgress === 0) {
      lastConfirmedLabel.current = null;
    }
  }, [holdProgress, match]);

  // ── Auto-generate sentence candidates when tokens accumulate ───────────────
  useEffect(() => {
    if (genTimer.current) clearTimeout(genTimer.current);
    if (glossTokens.length > 0 && candidates.length === 0 && !isGenerating) {
      genTimer.current = setTimeout(generate, 800);
    }
    return () => { if (genTimer.current) clearTimeout(genTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glossTokens, language]);

  // Re-synthesize when language toggle is pressed
  useEffect(() => {
    if (glossTokens.length > 0) {
      const synth = DialogueSynthesizer.synthesize(glossTokens, scenario, language);
      setIsEmergency(synth.isEmergency);
      if (synth.sentence) {
        setCandidates([synth.sentence]);
      }
    }
  }, [language, glossTokens, scenario]);

  const memoryLayer = useRef(new MemoryLayer()).current;

  const generate = useCallback(async () => {
    if (glossTokens.length === 0) return;
    setIsGenerating(true);
    try {
      // 1. Check ultra-fast on-device Translation Memory (< 2.1 µs)
      const memHit = memoryLayer.lookup(glossTokens);
      if (memHit.kind === 'exact') {
        const sentence =
          memHit.match.translations[language] || memHit.match.translations.en;
        if (sentence) {
          setCandidates([sentence]);
          setIsGenerating(false);
          return;
        }
      }

      // 2. Synthesize via deterministic scenario rules & SOS triage
      const synth = DialogueSynthesizer.synthesize(glossTokens, scenario, language);
      setIsEmergency(synth.isEmergency);
      const sentence = synth.sentence || (glossTokens.map(g => g.charAt(0) + g.slice(1).toLowerCase()).join(' ') + '.');
      setCandidates([sentence]);
    } catch (e) {
      console.error('[CounterScreen] Synthesis error:', e);
      const fallback = glossTokens.map(g => g.charAt(0) + g.slice(1).toLowerCase()).join(' ') + '.';
      setCandidates([fallback]);
    } finally {
      setIsGenerating(false);
    }
  }, [glossTokens, scenario, language, memoryLayer]);

  // ── Confirm & Speak aloud ───────────────────────────────────────────────────
  const confirm = useCallback(async (sentence: string) => {
    await speech.speakCitizen(sentence);
    setLines(prev => [...prev, { id: uid(), who: 'citizen', text: sentence, ts: Date.now() }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Save to on-device translation memory for future 0ms lookups
    const translations: { en: string; hi?: string; te?: string } = {
      en: sentence,
    };
    if (language === 'hi') translations.hi = sentence;
    if (language === 'te') translations.te = sentence;
    memoryLayer.remember(glossTokens, translations, scenario);

    setGlossTokens([]);
    setCandidates([]);
    lastConfirmedLabel.current = null;
  }, [speech, glossTokens, language, scenario, memoryLayer]);

  const discard = useCallback(() => {
    setGlossTokens([]);
    setCandidates([]);
    setIsGenerating(false);
    lastConfirmedLabel.current = null;
  }, []);

  // ── Hearing speech transcript listener ──────────────────────────────────────
  const prevClerkLinesLen = useRef(0);
  useEffect(() => {
    const newLines = speech.clerkLines.slice(prevClerkLinesLen.current);
    prevClerkLinesLen.current = speech.clerkLines.length;
    if (newLines.length === 0) return;
    newLines.forEach(text => {
      setLines(prev => [...prev, { id: uid(), who: 'clerk', text, ts: Date.now() }]);
    });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [speech.clerkLines]);

  const toggleListening = useCallback(async () => {
    if (listeningActive) {
      await speech.stopClerkListening();
      setListening(false);
    } else {
      await speech.startClerkListening();
      setListening(true);
    }
  }, [listeningActive, speech]);

  // ── Render Helpers ──────────────────────────────────────────────────────────

  const renderStatusBar = () => (
    <View style={s.statusBar}>
      <View style={[s.dot, { backgroundColor: T.clerk }]} />
      <Text style={s.statusText} numberOfLines={1}>
        OmniSign &middot; Live
      </Text>

      {/* Multilingual Selector */}
      <View style={s.langGroup}>
        {(['en', 'hi', 'te'] as SupportedLanguage[]).map(l => (
          <TouchableOpacity
            key={l}
            style={[s.langBtn, language === l && s.langBtnActive]}
            onPress={() => setLanguage(l)}
          >
            <Text style={[s.langBtnText, language === l && s.langBtnTextActive]}>
              {l.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {speech.isSpeaking && (
        <View style={[s.pill, { backgroundColor: '#4F7BE822', borderColor: T.citizen }]}>
          <Text style={[s.pillText, { color: T.citizen }]}>SPEAKING</Text>
        </View>
      )}
      {listeningActive && (
        <View style={[s.pill, { backgroundColor: '#2EBE7B22', borderColor: T.clerk }]}>
          <Text style={[s.pillText, { color: T.clerk }]}>LISTENING</Text>
        </View>
      )}
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Text style={s.backBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGlossBar = () => (
    <View style={s.glossBar}>
      {glossTokens.length === 0 ? (
        <Text style={s.glossPlaceholder}>Hold hand steady in guide to sign &rarr;</Text>
      ) : (
        glossTokens.map((g, i) => (
          <View key={i} style={s.glossChip}>
            <Text style={s.glossChipText}>{g}</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderHoldGuide = () => {
    const isMatching = match?.isKnown && match.label;
    const ringSize = 120 + holdProgress * 40;
    return (
      <View style={s.guideCenter} pointerEvents="none">
        {/* Animated Hold Progress Ring */}
        <View
          style={[
            s.guideRing,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderColor: isMatching ? T.clerk : 'rgba(255,255,255,0.4)',
              borderWidth: isMatching ? 3 : 1.5,
            },
          ]}
        />
        {isMatching ? (
          <View style={s.matchBadge}>
            <Text style={s.matchBadgeText}>{match.label}</Text>
            <Text style={s.matchProgressText}>{Math.round(holdProgress * 100)}%</Text>
          </View>
        ) : (
          <Text style={s.guideText}>Center Hand</Text>
        )}
      </View>
    );
  };

  const renderConfirmGate = () => {
    if (glossTokens.length === 0 && candidates.length === 0 && !isGenerating) return null;

    return (
      <View style={s.confirmGate}>
        {isEmergency && (
          <View style={s.emergencyBanner}>
            <Text style={s.emergencyText}>🚨 PRIORITY EMERGENCY TRIAGE</Text>
          </View>
        )}
        {isGenerating ? (
          <View style={s.generatingRow}>
            <ActivityIndicator color={T.citizen} size="small" />
            <Text style={s.generatingText}>Composing fluent sentence…</Text>
          </View>
        ) : (
          <>
            {candidates.map((c, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  s.candidateBtn,
                  i === 0 && s.candidateBtnPrimary,
                  isEmergency && { borderColor: T.danger, backgroundColor: '#E84F4F22' },
                ]}
                onPress={() => confirm(c)}
                activeOpacity={0.75}
              >
                <Text style={[s.candidateText, isEmergency && { color: '#FFAAAA' }]}>{c}</Text>
                {i === 0 && (
                  <View style={[s.speakBadge, isEmergency && { backgroundColor: T.danger }]}>
                    <Text style={s.speakBadgeText}>TAP TO SPEAK ALOUD 🔊</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.discardBtn} onPress={discard}>
              <Text style={s.discardText}>✕ Clear &amp; Re-sign</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderTranscriptPane = () => (
    <View style={s.transcriptPane}>
      <View style={s.transcriptHeader}>
        <Text style={s.transcriptHeaderLabel}>▼  HEARING PERSON SAYS</Text>
        {speech.partialText ? (
          <Text style={[s.partialText, { color: T.clerk }]} numberOfLines={1}>
            ↺ {speech.partialText}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[s.micBtn, listeningActive && s.micBtnActive]}
          onPress={toggleListening}
          activeOpacity={0.7}
        >
          <Text style={s.micBtnText}>{listeningActive ? '■ Stop Mic' : '● Listen Mic'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.transcriptScroll}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {lines.length === 0 && (
          <Text style={s.transcriptEmpty}>
            Conversation transcript will appear here.{'\n'}
            Sign above ↑ or tap "Listen Mic" when the hearing person speaks.
          </Text>
        )}
        {lines.map(line => (
          <View
            key={line.id}
            style={[s.lineRow, { borderLeftColor: line.who === 'citizen' ? T.citizen : T.clerk }]}
          >
            <Text style={[s.lineWho, { color: line.who === 'citizen' ? T.citizen : T.clerk }]}>
              {line.who === 'citizen' ? 'YOU (Signed &rarr; Spoken)' : 'THEY (Heard)'}
            </Text>
            <Text style={s.lineText}>{line.text}</Text>
            <Text style={s.lineTime}>
              {new Date(line.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  // ── Main View ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root} edges={['bottom']}>
      {renderStatusBar()}

      {/* Real-time Camera Stage (top 55%) */}
      <View style={s.cameraZone}>
        {device && hasPermission ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            frameProcessor={frameProcessor}
          />
        ) : (
          <View style={s.noCamera}>
            <ActivityIndicator color={T.citizen} />
            <Text style={s.noCameraText}>
              {hasPermission === false ? 'Camera permission required' : 'Initializing camera...'}
            </Text>
          </View>
        )}

        {/* Live Hand Hold Guide & Progress Ring */}
        {renderHoldGuide()}

        {/* Accumulated Gloss Tokens Bar */}
        {renderGlossBar()}

        {/* Sentence Confirm & Speak Gate */}
        {renderConfirmGate()}
      </View>

      {/* Live Two-Way Transcript (bottom 35%) */}
      {renderTranscriptPane()}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  statusBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  statusText: { flex: 1, fontSize: 11, color: T.muted },
  langGroup: { flexDirection: 'row', gap: 4, marginRight: 4 },
  langBtn: {
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#333',
  },
  langBtnActive: { backgroundColor: T.citizen, borderColor: T.citizen },
  langBtnText: { color: '#888', fontSize: 10, fontWeight: '800' },
  langBtnTextActive: { color: '#FFF' },
  emergencyBanner: {
    backgroundColor: '#E84F4F33', borderRadius: 6, borderWidth: 1, borderColor: T.danger,
    paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center', marginBottom: 6,
  },
  emergencyText: { color: '#FFAAAA', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  pill: {
    borderRadius: 4, borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  backBtn: { padding: 4 },
  backBtnText: { color: T.muted, fontSize: 16 },

  cameraZone: { flex: 55, position: 'relative', overflow: 'hidden', backgroundColor: '#000' },
  noCamera: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  noCameraText: { color: T.muted, fontSize: 12 },

  // Live hold guide
  guideCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  guideRing: {
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  guideText: {
    position: 'absolute', color: 'rgba(255,255,255,0.4)',
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
  },
  matchBadge: {
    position: 'absolute', backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    alignItems: 'center', borderWidth: 1, borderColor: T.clerk,
  },
  matchBadgeText: { color: T.clerk, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  matchProgressText: { color: '#FFF', fontSize: 10, fontWeight: '700', marginTop: 2 },

  glossBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.75)', minHeight: 44, alignItems: 'center',
  },
  glossPlaceholder: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  glossChip: { backgroundColor: T.citizen, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  glossChipText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  confirmGate: {
    position: 'absolute', bottom: 50, left: 10, right: 10,
    backgroundColor: 'rgba(15,15,18,0.95)', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: T.citizen, gap: 8,
  },
  generatingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  generatingText: { color: T.muted, fontSize: 12 },
  candidateBtn: {
    backgroundColor: T.surface, borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: T.border, gap: 4,
  },
  candidateBtnPrimary: { borderColor: T.citizen, backgroundColor: '#4F7BE822' },
  candidateText: { color: T.text, fontSize: 14, lineHeight: 20 },
  speakBadge: {
    alignSelf: 'flex-start', backgroundColor: T.citizen,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  speakBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  discardBtn: { alignItems: 'center', paddingVertical: 4 },
  discardText: { color: T.danger, fontSize: 11 },

  // Transcript
  transcriptPane: {
    flex: 35, borderTopWidth: 2, borderTopColor: T.border,
  },
  transcriptHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  transcriptHeaderLabel: { color: T.clerk, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  partialText: { flex: 1, fontSize: 11, fontStyle: 'italic' },
  micBtn: {
    borderRadius: 6, borderWidth: 1, borderColor: T.muted,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  micBtnActive: { borderColor: T.clerk, backgroundColor: '#2EBE7B22' },
  micBtnText: { color: T.text, fontSize: 11, fontWeight: '700' },

  transcriptScroll: { flex: 1, backgroundColor: T.bg },
  transcriptEmpty: { color: T.muted, fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 20 },
  lineRow: {
    borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, gap: 2,
  },
  lineWho: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  lineText: { color: T.text, fontSize: 14, lineHeight: 20 },
  lineTime: { color: T.muted, fontSize: 10 },
});
