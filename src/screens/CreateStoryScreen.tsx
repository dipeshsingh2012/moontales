import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { api } from '../services/api';
import { Story } from '../types';

interface CreateStoryScreenProps {
  onStoryReady: (story: Story) => void;
  onViewLibrary: () => void;
}

const THEME_CHIPS = [
  'Friendly Dragon',
  'Enchanted Forest',
  'Brave Astronaut',
  'Gentle Bunny',
  'Starlit Sea',
  'Cozy Bedtime',
];

export const CreateStoryScreen: React.FC<CreateStoryScreenProps> = ({
  onStoryReady,
  onViewLibrary,
}) => {
  const [cuesInput, setCuesInput] = useState<string>('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  const toggleChip = (chip: string) => {
    if (selectedChips.includes(chip)) {
      setSelectedChips(selectedChips.filter((c) => c !== chip));
    } else {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  const handleGenerate = async () => {
    const customCues = cuesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const allCues = Array.from(new Set([...selectedChips, ...customCues]));

    if (allCues.length === 0) {
      Alert.alert('Story Cues Needed', 'Please pick a theme or type what your story should be about!');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationStep('Submitting story request...');

      const job = await api.createStory({
        userCues: allCues,
        pageCount: pageCount,
      });

      setGenerationStep('Writing enchanting story with Gemini...');

      const completedStory = await api.pollStoryUntilComplete(job.id, (storyUpdate) => {
        if (storyUpdate.status === 'generating') {
          setGenerationStep('Drawing illustrations and recording narration...');
        }
      });

      setGenerationStep('Story ready! Opening book...');
      onStoryReady(completedStory);
    } catch (err: any) {
      Alert.alert('Generation Failed', err.message || 'Could not generate story. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MoonTales</Text>
        <TouchableOpacity style={styles.libraryButton} onPress={onViewLibrary}>
          <Text style={styles.libraryButtonText}>Library</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Create a personalized bedtime adventure for tonight</Text>

        <Text style={styles.sectionLabel}>Pick Favorite Themes</Text>
        <View style={styles.chipsWrap}>
          {THEME_CHIPS.map((chip) => {
            const isSelected = selectedChips.includes(chip);
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggleChip(chip)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Add Characters or Ideas</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Luna the golden kitten, magical hot air balloon..."
          placeholderTextColor="#72757E"
          value={cuesInput}
          onChangeText={setCuesInput}
          multiline
        />

        <Text style={styles.sectionLabel}>Story Length (Pages)</Text>
        <View style={styles.pagesRow}>
          {[3, 5, 8].map((count) => (
            <TouchableOpacity
              key={count}
              style={[styles.pagePill, pageCount === count && styles.pagePillSelected]}
              onPress={() => setPageCount(count)}
            >
              <Text
                style={[
                  styles.pagePillText,
                  pageCount === count && styles.pagePillTextSelected,
                ]}
              >
                {count} Pages
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionContainer}>
          {isGenerating ? (
            <View style={styles.progressCard}>
              <ActivityIndicator size="large" color="#FFD166" style={{ marginBottom: 12 }} />
              <Text style={styles.progressStep}>{generationStep}</Text>
              <Text style={styles.progressSubtext}>Generating your story, illustrations, and voice narration</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
              <Text style={styles.generateButtonText}>Generate Bedtime Story</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0E17',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#242038',
  },
  title: {
    color: '#FFFFFE',
    fontSize: 22,
    fontWeight: '800',
  },
  libraryButton: {
    backgroundColor: '#242038',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  libraryButtonText: {
    color: '#FFD166',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    color: '#A7A9BE',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#FFFFFE',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#1E1B2E',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#37324D',
  },
  chipSelected: {
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
    borderColor: '#FFD166',
  },
  chipText: {
    color: '#C3B9D9',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFD166',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#1E1B2E',
    color: '#FFFFFE',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#37324D',
    marginBottom: 16,
  },
  pagesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pagePill: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#1E1B2E',
    borderWidth: 1,
    borderColor: '#37324D',
  },
  pagePillSelected: {
    backgroundColor: 'rgba(255, 209, 102, 0.2)',
    borderColor: '#FFD166',
  },
  pagePillText: {
    color: '#C3B9D9',
    fontSize: 14,
    fontWeight: '600',
  },
  pagePillTextSelected: {
    color: '#FFD166',
    fontWeight: '800',
  },
  actionContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
  generateButton: {
    backgroundColor: '#FFD166',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#0F0E17',
    fontSize: 17,
    fontWeight: '800',
  },
  progressCard: {
    backgroundColor: '#1E1B2E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.4)',
  },
  progressStep: {
    color: '#FFFFFE',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  progressSubtext: {
    color: '#A7A9BE',
    fontSize: 13,
    textAlign: 'center',
  },
});
