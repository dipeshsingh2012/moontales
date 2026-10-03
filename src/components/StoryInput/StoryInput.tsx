import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { VoiceService } from '../../services';
import { StoryGenerationOptions } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useStoryContext } from '../../context/StoryContext';

// Preset theme chips
const PRESET_THEMES = [
  { label: 'Fantasy 🧙', value: 'fantasy' },
  { label: 'Adventure 🗺️', value: 'adventure' },
  { label: 'Animals 🐾', value: 'animals' },
  { label: 'Space 🚀', value: 'space' },
  { label: 'Ocean 🌊', value: 'ocean' },
  { label: 'Dinosaurs 🦕', value: 'dinosaurs' },
  { label: 'Superheroes 🦸', value: 'superheroes' },
  { label: 'Fairy Tales 🏰', value: 'fairy tales' },
];

interface StoryInputProps {
  onGenerate: (options: StoryGenerationOptions) => void;
  isLoading: boolean;
}

export function StoryInput({ onGenerate, isLoading }: StoryInputProps) {
  const { colors } = useTheme();
  const { userPreferences } = useStoryContext();

  const [prompt, setPrompt] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>(
    userPreferences.defaultStoryLength || 'medium'
  );
  const [characters, setCharacters] = useState(
    userPreferences.childName ? userPreferences.childName : ''
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Create voice service with the user's API key for Whisper
  const voiceServiceRef = useRef<VoiceService | null>(null);
  const getVoiceService = () => {
    if (!voiceServiceRef.current) {
      voiceServiceRef.current = new VoiceService(
        {
          onRecordingStart: () => setIsRecording(true),
          onRecordingStop: () => {
            setIsRecording(false);
            setIsTranscribing(true);
          },
          onTranscriptionComplete: (text) => {
            setPrompt(text);
            setIsTranscribing(false);
          },
          onError: (error) => {
            setIsRecording(false);
            setIsTranscribing(false);
            Alert.alert('Voice Error', error);
          },
        },
        userPreferences.apiKey ?? ''
      );
    } else {
      // Update API key in case it changed in settings
      voiceServiceRef.current.setApiKey(userPreferences.apiKey ?? '');
    }
    return voiceServiceRef.current;
  };

  const handleVoiceRecord = async () => {
    const vs = getVoiceService();
    try {
      if (isRecording) {
        const audioUri = await vs.stopRecording();
        await vs.transcribeAudio(audioUri);
      } else {
        await vs.startRecording();
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Voice recording failed');
    }
  };

  const handleThemeChip = (value: string) => {
    setSelectedTheme((prev) => (prev === value ? '' : value));
    setCustomTheme('');
  };

  const handleCustomTheme = (text: string) => {
    setCustomTheme(text);
    setSelectedTheme('');
  };

  const effectiveTheme = selectedTheme || customTheme;

  const handleGenerate = () => {
    if (!prompt.trim()) {
      Alert.alert('Missing prompt', 'Please enter what your story should be about.');
      return;
    }

    const options: StoryGenerationOptions = {
      prompt: prompt.trim(),
      theme: effectiveTheme || undefined,
      length,
      characters: characters.trim()
        ? characters.split(',').map((c) => c.trim()).filter(Boolean)
        : undefined,
    };

    onGenerate(options);
  };

  const voiceButtonLabel = isTranscribing
    ? '⏳ Transcribing...'
    : isRecording
    ? '⏹ Stop Recording'
    : '🎤 Use Voice Input';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Child greeting */}
      {userPreferences.childName ? (
        <Text style={[styles.greeting, { color: colors.primary }]}>
          Hi {userPreferences.childName}! What story tonight? 🌙
        </Text>
      ) : (
        <Text style={[styles.greeting, { color: colors.primary }]}>
          What story would you like? 🌙
        </Text>
      )}

      {/* Prompt input */}
      <TextInput
        style={[
          styles.promptInput,
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
        ]}
        placeholder="Once upon a time there was a brave child who..."
        placeholderTextColor={colors.placeholder}
        value={prompt}
        onChangeText={setPrompt}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Voice button */}
      <TouchableOpacity
        style={[
          styles.voiceButton,
          isRecording && styles.recordingButton,
          isTranscribing && styles.transcribingButton,
        ]}
        onPress={handleVoiceRecord}
        disabled={isTranscribing}
      >
        <Text style={styles.voiceButtonText}>{voiceButtonLabel}</Text>
      </TouchableOpacity>

      {/* Theme section */}
      <Text style={[styles.sectionLabel, { color: colors.primary }]}>
        Pick a Theme
      </Text>

      <View style={styles.chipGrid}>
        {PRESET_THEMES.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[
              styles.chip,
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedTheme === t.value && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => handleThemeChip(t.value)}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.text },
                selectedTheme === t.value && { color: 'white' },
              ]}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
        ]}
        placeholder="Or type a custom theme..."
        placeholderTextColor={colors.placeholder}
        value={customTheme}
        onChangeText={handleCustomTheme}
      />

      {/* Length selector */}
      <Text style={[styles.sectionLabel, { color: colors.primary }]}>Story Length</Text>
      <View style={styles.lengthButtons}>
        {(['short', 'medium', 'long'] as const).map((l) => (
          <TouchableOpacity
            key={l}
            style={[
              styles.lengthButton,
              { backgroundColor: colors.card, borderColor: colors.border },
              length === l && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setLength(l)}
          >
            <Text
              style={[
                styles.lengthButtonText,
                { color: colors.text },
                length === l && { color: 'white' },
              ]}
            >
              {l === 'short' ? '⚡ Short' : l === 'medium' ? '📖 Medium' : '📚 Long'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Characters */}
      <Text style={[styles.sectionLabel, { color: colors.primary }]}>
        Characters (optional)
      </Text>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
        ]}
        placeholder="Luna, Max, Bella..."
        placeholderTextColor={colors.placeholder}
        value={characters}
        onChangeText={setCharacters}
      />

      {/* Generate button */}
      <TouchableOpacity
        style={[styles.generateButton, isLoading && styles.disabledButton]}
        onPress={handleGenerate}
        disabled={isLoading}
      >
        <Text style={styles.generateButtonText}>
          {isLoading ? '✨ Generating...' : 'Generate Story ✨'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  promptInput: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    fontSize: 15,
    borderWidth: 1,
  },
  voiceButton: {
    backgroundColor: '#6200ee',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingButton: {
    backgroundColor: '#b00020',
  },
  transcribingButton: {
    backgroundColor: '#e67e22',
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lengthButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  lengthButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  lengthButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#03dac6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
