import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Dimensions, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useStoryContext } from '../context/StoryContext';
import { Story } from '../types';

import { StoryLoader } from '../components';

const { width } = Dimensions.get('window');
const H_PAD   = 16;
const COL_GAP = 10;
const COLS    = 3;
const CARD_W  = (width - H_PAD * 2 - COL_GAP * (COLS - 1)) / COLS;
const CARD_H  = CARD_W + 12;
const RECENT_W = (width - H_PAD * 2 - COL_GAP) / 2;

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

function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
  return rows;
}

const THEME_MAP: Record<string, { color: string; emoji: string }> = Object.fromEntries(
  THEMES.map(t => [t.value, { color: t.color, emoji: t.emoji }])
);
function getThemeStyle(title: string) {
  const key = Object.keys(THEME_MAP).find(k => title?.toLowerCase().includes(k));
  return key ? THEME_MAP[key] : { color: '#4527a0', emoji: '📖' };
}

export default function HomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { userPreferences, generateStory, isLoading, stories, generationStatus, error } = useStoryContext();
  const [searchText, setSearchText]           = useState('');
  const [generatingTheme, setGeneratingTheme] = useState('');

  // Use 6 most-recent completed stories from context
  const recentStories = stories.filter(s => s.status === 'completed').slice(0, 6);


  // 1. Theme tap → generate immediately, no Create screen
  const handleThemeTap = async (theme: typeof THEMES[0]) => {
    setGeneratingTheme(theme.value);
    const childName = userPreferences.childName;
    try {
      await generateStory({
        prompt: childName
          ? `A ${theme.label} bedtime story for ${childName}`
          : `A ${theme.label} bedtime story`,
        theme: theme.value,
        length: userPreferences.defaultStoryLength || 'medium',
      });
      navigation.navigate('StoryView');
    } catch (err) {
      console.warn('Theme tap generation error:', err);
    } finally {
      setGeneratingTheme('');
    }
  };

  // 5. Surprise me → random theme, generate immediately
  const handleSurprise = async () => {
    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    await handleThemeTap(theme);
  };

  const handleSearch = () => {
    const q = searchText.trim();
    setSearchText('');
    navigation.navigate('Create', q ? { presetPrompt: q } : {});
  };

  const handleStoryTap = (story: Story) => {
    navigation.navigate('StoryView', { story });
  };

  const greeting = userPreferences.childName
    ? `Hi ${userPreferences.childName}! 🌙`
    : 'Good night! 🌙';

  const themeRows  = chunk(THEMES, COLS);
  const recentRows = chunk(recentStories, 2);

  // Show interactive kid-friendly loader while generating from Home
  if (isLoading && generatingTheme) {
    const t = THEMES.find(t => t.value === generatingTheme);
    return (
      <StoryLoader
        status={generationStatus || `Writing your ${t?.label || 'bedtime'} story...`}
        themeTitle={t?.label ? `${t.emoji} ${t.label} Story` : undefined}
        onDismiss={() => setGeneratingTheme('')}
      />
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>🌙 Moontales</Text>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>
      </View>

      {/* Search + mic row */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="What story tonight?"
            placeholderTextColor={colors.placeholder}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        {/* 4. Prominent mic — navigates to Create which auto-starts recording */}
        <TouchableOpacity
          style={styles.micButton}
          onPress={() => navigation.navigate('Create', { startVoice: true })}
        >
          <Text style={styles.micIcon}>🎤</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Surprise me button */}
      <TouchableOpacity
        style={[styles.surpriseBtn, { backgroundColor: colors.accent }]}
        onPress={handleSurprise}
        activeOpacity={0.8}
      >
        <Text style={styles.surpriseText}>🎲  Surprise Me!</Text>
      </TouchableOpacity>

      {/* Theme grid — 1 tap = instant story */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Pick a Story</Text>
      <View style={styles.grid}>
        {themeRows.map((row, ri) => (
          <View key={ri} style={styles.gridRow}>
            {row.map(theme => (
              <TouchableOpacity
                key={theme.value}
                style={[styles.themeCard, { backgroundColor: theme.color, width: CARD_W, height: CARD_H }]}
                onPress={() => handleThemeTap(theme)}
                activeOpacity={0.8}
              >
                <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                <Text style={styles.themeLabel}>{theme.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Recent stories */}
      {recentStories.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Stories</Text>
          <View style={styles.grid}>
            {recentRows.map((row, ri) => (
              <View key={ri} style={styles.gridRow}>
                {row.map(story => {
                  const { color, emoji } = getThemeStyle(story.title ?? '');
                  return (
                    <TouchableOpacity
                      key={story.id}
                      style={[styles.recentCard, { backgroundColor: color, width: RECENT_W }]}
                      onPress={() => handleStoryTap(story)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.recentEmoji}>{emoji}</Text>
                      <Text style={styles.recentTitle} numberOfLines={2}>{story.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </>
      )}

      {recentStories.length === 0 && (
        <View style={styles.emptyRecent}>
          <Text style={styles.emptyEmoji}>✨</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Tap a theme above to create your first story!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingFull:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingEmoji: { fontSize: 80 },
  loadingText:  { fontSize: 18, marginTop: 16, fontWeight: '600', textAlign: 'center' },

  container:    { flex: 1 },
  content:      { padding: H_PAD, paddingBottom: 32 },
  header:       { marginBottom: 20, marginTop: 8 },
  appTitle:     { fontSize: 32, fontWeight: '900', color: '#ffffff', letterSpacing: -0.5 },
  greeting:     { fontSize: 16, marginTop: 2 },

  searchRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, marginRight: 10,
  },
  searchIcon:   { fontSize: 18, marginRight: 8 },
  searchInput:  { flex: 1, fontSize: 16, fontWeight: '500' },
  micButton: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#22c55e',
    justifyContent: 'center', alignItems: 'center',
  },
  micIcon:      { fontSize: 24 },

  surpriseBtn: {
    borderRadius: 18, paddingVertical: 16,
    alignItems: 'center', marginBottom: 24,
    elevation: 4, shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  surpriseText: { fontSize: 18, fontWeight: '900', color: '#1a0a2e' },

  sectionTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  grid:         { marginBottom: 24 },
  gridRow:      { flexDirection: 'row', marginBottom: COL_GAP },

  themeCard: {
    marginRight: COL_GAP, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  themeEmoji:   { fontSize: 32, marginBottom: 6 },
  themeLabel:   { fontSize: 12, fontWeight: '800', color: '#fff' },

  recentCard: {
    height: 140, borderRadius: 20, padding: 14, justifyContent: 'flex-end',
    marginRight: COL_GAP,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  recentEmoji:  { fontSize: 36, marginBottom: 6 },
  recentTitle:  { fontSize: 15, fontWeight: '800', color: '#fff' },

  emptyRecent:  { alignItems: 'center', marginTop: 24, marginBottom: 16 },
  emptyEmoji:   { fontSize: 48, marginBottom: 10 },
  emptyText:    { fontSize: 15, textAlign: 'center' },
});
