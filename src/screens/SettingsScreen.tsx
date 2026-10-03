import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useStoryContext } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import { VoiceCloning } from '../components/VoiceCloning';
import { ElevenLabsService } from '../services/voice';

export default function SettingsScreen() {
  const { colors, toggleTheme, isDark } = useTheme();
  const { userPreferences, updateUserPreferences } = useStoryContext();
  const { user, signOut } = useAuth();
  const [isCloningVoice, setIsCloningVoice] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again to generate stories.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleVoiceFileSelected = async (fileUri: string, fileName: string) => {
    // Get ElevenLabs API key - in production, this should come from backend or secure storage
    const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      Alert.alert(
        'API Key Missing',
        'ElevenLabs API key is not configured. Please add EXPO_PUBLIC_ELEVENLABS_API_KEY to your environment variables.',
      );
      return;
    }

    Alert.prompt(
      'Name Your Voice',
      'Enter a name for this cloned voice:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clone',
          onPress: async (voiceName?: string) => {
            if (!voiceName || voiceName.trim() === '') {
              Alert.alert('Name Required', 'Please enter a name for your voice.');
              return;
            }

            setIsCloningVoice(true);
            try {
              const elevenLabsService = new ElevenLabsService(apiKey);
              const voiceId = await elevenLabsService.cloneVoice(fileUri, voiceName.trim());
              
              // Update the voice ID in preferences
              await updateUserPreferences({ voiceId });
              
              Alert.alert(
                'Voice Cloned Successfully!',
                `"${voiceName}" is now ready to narrate your stories.`,
              );
            } catch (error) {
              console.error('Voice cloning failed:', error);
              Alert.alert(
                'Cloning Failed',
                error instanceof Error ? error.message : 'Failed to clone voice. Please try again.',
              );
            } finally {
              setIsCloningVoice(false);
            }
          },
        },
      ],
      'plain-text',
      `Parent Voice ${new Date().toLocaleDateString()}`,
    );
  };

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>⚙️ Settings</Text>

      {/* Account */}
      <Text style={[styles.section, { color: colors.primary }]}>Account</Text>

      <View style={[styles.row, { backgroundColor: colors.card }]}>
        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Signed in as</Text>
        <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={1}>
          {user?.email ?? user?.uid ?? '—'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.bigBtn, { backgroundColor: colors.card }]}
        onPress={handleSignOut}
      >
        <Text style={styles.bigBtnIcon}>🚪</Text>
        <Text style={[styles.bigBtnLabel, { color: colors.error ?? '#ef4444' }]}>Sign Out</Text>
      </TouchableOpacity>

      {/* Child profile */}
      <Text style={[styles.section, { color: colors.primary }]}>Child Profile</Text>

      <Row label="Name">
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Child's name"
          placeholderTextColor={colors.placeholder}
          value={userPreferences.childName}
          onChangeText={(t) => void updateUserPreferences({ childName: t })}
        />
      </Row>

      {/* Story preferences */}
      <Text style={[styles.section, { color: colors.primary }]}>Stories</Text>

      <Row label="Default length">
        <View style={styles.pills}>
          {(['short', 'medium', 'long'] as const).map((l) => (
            <TouchableOpacity
              key={l}
              style={[
                styles.pill,
                { backgroundColor: userPreferences.defaultStoryLength === l ? colors.primary : colors.cardElevated },
              ]}
              onPress={() => void updateUserPreferences({ defaultStoryLength: l })}
            >
              <Text style={[styles.pillText, { color: '#fff' }]}>
                {l === 'short' ? '⚡' : l === 'medium' ? '📖' : '📚'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Row>

      {/* Narration */}
      <Text style={[styles.section, { color: colors.primary }]}>Narration</Text>

      <VoiceCloning 
        onVoiceFileSelected={handleVoiceFileSelected}
        currentVoiceId={userPreferences.voiceId}
        isCloning={isCloningVoice}
      />

      <Row label="Voice ID (Manual)">
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="pNInz6obpgDQGcFmaJgB"
          placeholderTextColor={colors.placeholder}
          value={userPreferences.voiceId}
          onChangeText={(t) => void updateUserPreferences({ voiceId: t })}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Row>

      {/* Appearance */}
      <Text style={[styles.section, { color: colors.primary }]}>Appearance</Text>

      <TouchableOpacity
        style={[styles.bigBtn, { backgroundColor: colors.card }]}
        onPress={toggleTheme}
      >
        <Text style={styles.bigBtnIcon}>{isDark ? '☀️' : '🌙'}</Text>
        <Text style={[styles.bigBtnLabel, { color: colors.text }]}>
          Switch to {isDark ? 'Light' : 'Night'} Mode
        </Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.textSecondary }]}>
        MoonTales v1.0 · Powered by Gemini + ElevenLabs
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  content:     { padding: 20, paddingBottom: 48 },
  screenTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 20, marginTop: 8 },
  section:     { fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: 20, marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, padding: 14, marginBottom: 8,
  },
  rowLabel:  { fontSize: 15, fontWeight: '600', flex: 1 },
  rowValue:  { fontSize: 14, fontWeight: '500', flex: 1.5, textAlign: 'right' },
  rowRight:  { flex: 2, alignItems: 'flex-end' },
  input:     { fontSize: 15, fontWeight: '500', textAlign: 'right', width: '100%' },
  pills:     { flexDirection: 'row', gap: 6 },
  pill:      { width: 40, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  pillText:  { fontSize: 13, fontWeight: '700' },
  bigBtn:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, marginBottom: 8 },
  bigBtnIcon:  { fontSize: 22 },
  bigBtnLabel: { fontSize: 16, fontWeight: '700' },
  version:     { textAlign: 'center', fontSize: 12, marginTop: 32 },
});
