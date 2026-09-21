/**
 * screens/SetupScreen.tsx
 * Single-device entry screen — choose scenario and start conversation.
 * No external laptops, no second devices, no pairing required.
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SetupScreenProps, Scenario } from '../navigation/types';

const SCENARIOS: { id: Scenario; emoji: string; title: string; desc: string }[] = [
  { id: 'hospital', emoji: '🏥', title: 'Hospital / Clinic', desc: 'Medicine, prescription, pain, appointments' },
  { id: 'bank',     emoji: '🏦', title: 'Bank / Cash Counter', desc: 'Account, withdrawals, payments, problems' },
  { id: 'general',  emoji: '🏛️', title: 'General Service',    desc: 'Public counters, tickets, inquiries' },
];

export function SetupScreen({ navigation }: SetupScreenProps) {
  const [selected, setSelected] = useState<Scenario>('hospital');

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Brand */}
        <View style={s.header}>
          <View style={s.brandIcon}>
            <Text style={{ fontSize: 24 }}>🤟</Text>
          </View>
          <Text style={s.logo}>OmniSign</Text>
          <Text style={s.tagline}>Two-Way Sign &amp; Voice Conversation</Text>
        </View>

        {/* Feature Explanation Banner */}
        <View style={s.featureBanner}>
          <View style={s.featureRow}>
            <Text style={s.featureIcon}>🗣️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.featureTitle}>You Sign &rarr; Phone Speaks</Text>
              <Text style={s.featureDesc}>Sign keywords into front camera. AI speaks the natural sentence aloud.</Text>
            </View>
          </View>
          <View style={s.featureDivider} />
          <View style={s.featureRow}>
            <Text style={s.featureIcon}>👂</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.featureTitle}>They Speak &rarr; Phone Transcribes</Text>
              <Text style={s.featureDesc}>Hearing person replies into phone mic. You read their words on screen.</Text>
            </View>
          </View>
        </View>

        {/* Scenario Selection */}
        <Text style={s.sectionLabel}>SELECT CONVERSATION SCENARIO</Text>
        {SCENARIOS.map(sc => (
          <TouchableOpacity
            key={sc.id}
            style={[s.card, selected === sc.id && s.cardActive]}
            onPress={() => setSelected(sc.id)}
            activeOpacity={0.7}
          >
            <Text style={s.cardEmoji}>{sc.emoji}</Text>
            <View style={s.cardText}>
              <Text style={[s.cardTitle, selected === sc.id && { color: '#4F7BE8' }]}>{sc.title}</Text>
              <Text style={s.cardDesc}>{sc.desc}</Text>
            </View>
            {selected === sc.id && <Text style={s.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}

        {/* Start Button */}
        <TouchableOpacity
          style={s.startBtn}
          onPress={() => navigation.navigate('Counter', { scenario: selected })}
          activeOpacity={0.85}
        >
          <Text style={s.startBtnText}>Start Conversation &rarr;</Text>
        </TouchableOpacity>

        {/* Privacy Assurance */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            🔒 100% on this single phone &middot; Zero external devices &middot; No internet needed
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0D' },
  scroll: { padding: 22, gap: 14 },

  header: { alignItems: 'center', paddingVertical: 18, gap: 6 },
  brandIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#4F7BE822', borderWidth: 1, borderColor: '#4F7BE8', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  logo: { fontSize: 34, fontWeight: '900', color: '#F0F0F0', letterSpacing: -1 },
  tagline: { fontSize: 13, color: '#888', textAlign: 'center' },

  featureBanner: { backgroundColor: '#161922', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#252d42', gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { fontSize: 22 },
  featureTitle: { fontSize: 13, fontWeight: '700', color: '#F0F0F0' },
  featureDesc: { fontSize: 11, color: '#8b94a5', marginTop: 2 },
  featureDivider: { height: 1, backgroundColor: '#252d42' },

  sectionLabel: { fontSize: 10, letterSpacing: 2, color: '#555', marginTop: 4 },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 16, gap: 14, borderWidth: 1, borderColor: '#2C2C2C' },
  cardActive: { borderColor: '#4F7BE8', backgroundColor: '#4F7BE81A' },
  cardEmoji: { fontSize: 24 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#F0F0F0' },
  cardDesc: { fontSize: 12, color: '#666', marginTop: 2 },
  checkmark: { color: '#4F7BE8', fontSize: 18, fontWeight: '700' },

  startBtn: { backgroundColor: '#4F7BE8', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  footer: { paddingVertical: 12, alignItems: 'center' },
  footerText: { color: '#555', fontSize: 11, textAlign: 'center' },
});
