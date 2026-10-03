import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useStoryContext } from '../context/StoryContext';
import { VoiceService } from '../services';
import { StoryLoader } from '../components';

const THEMES = [
  { label: 'Fantasy',     emoji: '🧙', color: '#7b2fbe', value: 'fantasy' },
  { label: 'Space',       emoji: '🚀', color: '#1565c0', value: 'space' },
  { label: 'Adventure',   emoji: '🗺️', color: '#e65100', value: 'adventure' },
  { label: 'Animals',     emoji: '🐾', color: '#2e7d32', value: 'animals' },
  { label: 'Ocean',       emoji: '🌊', color: '#00838f', value: 'ocean' },
  { label: 'Dinosaurs',   emoji: '🦕', color: '#6d4c41', value: 'dinosaurs' },
  { label: 'Superheroes', emoji: '🦸', color: '#c62828', value: 'superheroes' },
  { label: 'Fairy Tales', emoji: '🏰', color: '#ad1457', value: 'fairy tales' },
  { label: 'Bedtime',     emoji: '🌙', color: '#4527a0', value: 'bedtime' },
];

const LENGTHS = [
  { label: '⚡ Quick', value: 'short' as const },
  { label: '📖 Normal', value: 'medium' as const },
  { label: '📚 Long', value: 'long' as const },
];

export default function CreateScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { generateStory, isLoading, generationStatus, userPreferences } = useStoryContext();

  const presetTheme = route?.params?.presetTheme || '';
  const presetPrompt = route?.params?.presetPrompt || '';

  const [prompt, setPrompt]           = useState(presetPrompt);
  const [selectedTheme, setSelectedTheme] = useState(presetTheme);
  const [length, setLength]           = useState<'short'|'medium'|'long'>('medium');
  const [characters, setCharacters]   = useState(userPreferences.childName || '');
  const [cues, setCues]               = useState<string[]>([]);
  const [newCueText, setNewCueText]   = useState('');
  const [showAddCue, setShowAddCue]   = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const voiceRef = useRef<VoiceService | null>(null);

  // Update from route params when navigating from Home
  useEffect(() => {
    if (route?.params?.presetTheme) setSelectedTheme(route.params.presetTheme);
    if (route?.params?.presetPrompt) setPrompt(route.params.presetPrompt);
  }, [route?.params]);

  // 4. Auto-start voice when launched from the mic button on Home
  useEffect(() => {
    if (route?.params?.startVoice) {
      const timer = setTimeout(() => {
        handleVoice();
      }, 600); // slight delay so screen has rendered
      return () => clearTimeout(timer);
    }
  }, []);

  const getVoiceService = () => {
    if (!voiceRef.current) {
      voiceRef.current = new VoiceService({
        onRecordingStart:        () => setIsRecording(true),
        onRecordingStop:         () => { setIsRecording(false); setIsTranscribing(true); },
        onTranscriptionComplete: (text) => { setPrompt(text); setIsTranscribing(false); },
        onCuesExtracted:         (res) => {
          if (res.prompt) setPrompt(res.prompt);
          if (res.theme) setSelectedTheme(res.theme);
          if (res.characters && res.characters.length > 0) {
            setCharacters(res.characters.join(', '));
          }
          if (res.cues && res.cues.length > 0) {
            setCues(prev => Array.from(new Set([...prev, ...res.cues])));
          }
        },
        onError:                 (err) => { setIsRecording(false); setIsTranscribing(false); Alert.alert('Voice Error', err); },
      }, '');
    }
    return voiceRef.current;
  };

  const handleVoice = async () => {
    const vs = getVoiceService();
    try {
      if (isRecording) {
        const uri = await vs.stopRecording();
        await vs.transcribeAudio(uri);
      } else {
        await vs.startRecording();
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Voice failed');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !selectedTheme) {
      Alert.alert('Tell me something!', 'Type a story idea or pick a theme above.');
      return;
    }
    const finalPrompt = prompt.trim() || `A ${selectedTheme} bedtime story`;
    await generateStory({
      prompt: finalPrompt,
      theme: selectedTheme || undefined,
      length,
      characters: characters.trim()
        ? characters.split(',').map(c => c.trim()).filter(Boolean)
        : undefined,
      cues: cues.length > 0 ? cues : undefined,
    });
    navigation.navigate('StoryView');
  };

  if (isLoading) {
    return (
      <StoryLoader
        status={generationStatus || 'Writing your story…'}
        themeTitle={selectedTheme ? `${selectedTheme} Story` : undefined}
      />
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">

      <Text style={styles.screenTitle}>✨ Create a Story</Text>

      {/* Prompt */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>What should happen?</Text>
      <View style={styles.promptRow}>
        <TextInput
          style={[styles.promptInput, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="A dragon who loves flowers..."
          placeholderTextColor={colors.placeholder}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.inlineMic, {
            backgroundColor: isRecording ? '#ef4444' : isTranscribing ? '#f59e0b' : '#22c55e'
          }]}
          onPress={handleVoice}
          disabled={isTranscribing}
        >
          <Text style={styles.micText}>
            {isTranscribing ? '⏳' : isRecording ? '⏹' : '🎤'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Theme chips */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>Theme</Text>
      <View style={styles.chipWrap}>
        {THEMES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[
              styles.chip,
              { backgroundColor: selectedTheme === t.value ? t.color : colors.card },
            ]}
            onPress={() => setSelectedTheme((v: string) => v === t.value ? '' : t.value)}
          >
            <Text style={styles.chipEmoji}>{t.emoji}</Text>
            <Text style={[styles.chipLabel, { color: '#fff' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Length */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>Length</Text>
      <View style={styles.lengthRow}>
        {LENGTHS.map(l => (
          <TouchableOpacity
            key={l.value}
            style={[
              styles.lengthBtn,
              { backgroundColor: length === l.value ? colors.primary : colors.card },
            ]}
            onPress={() => setLength(l.value)}
          >
            <Text style={[styles.lengthLabel, { color: '#fff' }]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Characters */}
      <Text style={[styles.label, { color: colors.textSecondary }]}>Characters (optional)</Text>
      <TextInput
        style={[styles.smallInput, { backgroundColor: colors.card, color: colors.text }]}
        placeholder="Luna, Max..."
        placeholderTextColor={colors.placeholder}
        value={characters}
        onChangeText={setCharacters}
      />

      {/* Story & Visual Cues */}
      <View style={styles.cuesHeaderRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Visual & Story Cues</Text>
        <TouchableOpacity onPress={() => setShowAddCue(!showAddCue)}>
          <Text style={[styles.addCueBtnText, { color: colors.primary }]}>
            {showAddCue ? 'Cancel' : '+ Add Cue'}
          </Text>
        </TouchableOpacity>
      </View>

      {showAddCue && (
        <View style={styles.addCueRow}>
          <TextInput
            style={[styles.cueInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="e.g. glowing stars, fluffy rabbit..."
            placeholderTextColor={colors.placeholder}
            value={newCueText}
            onChangeText={setNewCueText}
            onSubmitEditing={() => {
              if (newCueText.trim()) {
                setCues(prev => [...prev, newCueText.trim()]);
                setNewCueText('');
              }
            }}
          />
          <TouchableOpacity
            style={[styles.addCueConfirmBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (newCueText.trim()) {
                setCues(prev => [...prev, newCueText.trim()]);
                setNewCueText('');
              }
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {cues.length > 0 ? (
        <View style={styles.cueChipsWrap}>
          {cues.map((cue, index) => (
            <View key={index} style={[styles.cueChip, { backgroundColor: 'rgba(139, 92, 246, 0.22)', borderColor: 'rgba(139, 92, 246, 0.45)' }]}>
              <Text style={styles.cueChipText}>✨ {cue}</Text>
              <TouchableOpacity
                onPress={() => setCues(prev => prev.filter((_, i) => i !== index))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.cueChipRemoveBtn}
              >
                <Text style={styles.cueChipRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.cuesHint, { color: colors.textSecondary }]}>
          💡 Speak with mic or type cues to steer magical items, scenery, and characters!
        </Text>
      )}

      {/* Generate */}
      <TouchableOpacity
        style={[styles.generateBtn, { backgroundColor: colors.primary }]}
        onPress={handleGenerate}
      >
        <Text style={styles.generateLabel}>✨ Generate Story</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex:1, justifyContent:'center', alignItems:'center' },
  loadingMoon:      { fontSize: 64 },
  loadingText:      { fontSize: 18, marginTop: 16, fontWeight: '600' },
  container:        { flex: 1 },
  content:          { padding: 20, paddingBottom: 40 },
  screenTitle:      { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 20, marginTop: 8 },
  label:            { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  promptRow:        { flexDirection: 'row', gap: 10 },
  promptInput: {
    flex: 1, borderRadius: 16, padding: 14, fontSize: 16, minHeight: 90,
  },
  inlineMic: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end',
  },
  micText:   { fontSize: 22 },
  chipWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontWeight: '700' },
  lengthRow: { flexDirection: 'row', gap: 10 },
  lengthBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
  },
  lengthLabel: { fontSize: 14, fontWeight: '700' },
  smallInput: {
    borderRadius: 14, padding: 14, fontSize: 15,
  },
  generateBtn: {
    marginTop: 28, paddingVertical: 18, borderRadius: 20, alignItems: 'center',
    elevation: 6, shadowColor: '#a855f7', shadowOffset: {width:0,height:4}, shadowOpacity:0.4, shadowRadius:8,
  },
  generateLabel: { fontSize: 20, fontWeight: '900', color: '#fff' },

  cuesHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, marginBottom: 8,
  },
  addCueBtnText: {
    fontSize: 13, fontWeight: '800',
  },
  addCueRow: {
    flexDirection: 'row', gap: 8, marginBottom: 12,
  },
  cueInput: {
    flex: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14,
  },
  addCueConfirmBtn: {
    paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  cueChipsWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4,
  },
  cueChip: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  cueChipText: {
    color: '#e9d5ff', fontSize: 13, fontWeight: '700', marginRight: 6,
  },
  cueChipRemoveBtn: {
    padding: 2,
  },
  cueChipRemove: {
    color: '#c084fc', fontSize: 12, fontWeight: '900',
  },
  cuesHint: {
    fontSize: 13, fontStyle: 'italic', marginTop: 4, lineHeight: 18,
  },
});
