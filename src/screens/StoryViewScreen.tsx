import React, { useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useStoryContext } from '../context/StoryContext';
import { useTheme } from '../context/ThemeContext';
import { StoryBook } from '../components/StoryBook';
import { StoryLoader } from '../components/StoryLoader';

export default function StoryViewScreen({ navigation, route }: any) {
  const { currentStory, setCurrentStory, isLoading, error } = useStoryContext();
  const { colors } = useTheme();

  // Library taps pass story via route.params — load it into context
  useEffect(() => {
    if (route?.params?.story) {
      setCurrentStory(route.params.story);
    }
  }, [route?.params?.story]);

  const handleClose = () => {
    setCurrentStory(null);
    navigation.goBack();
  };

  const handleNewStory = () => {
    setCurrentStory(null);
    navigation.goBack();
    // Navigate to Home tab
    navigation.navigate('Main', { screen: 'Home' });
  };

  // Stories are saved server-side automatically — nothing to do on last page.

  // Loading state — generated while waiting for first page
  if (isLoading) {
    return (
      <StoryLoader
        status="Weaving words and painting the first magical page..."
        onDismiss={() => {
          setCurrentStory(null);
          navigation.goBack();
        }}
      />
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>😔</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{error}</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentStory) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📖</Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>No story loaded.</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <StoryBook
      story={currentStory}
      onClose={handleClose}
      onNewStory={handleNewStory}
    />
  );
}

const styles = StyleSheet.create({
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingMoon: { fontSize: 72 },
  loadingText: { fontSize: 18, marginTop: 16, fontWeight: '600', textAlign: 'center' },
  infoText:    { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  btn:         { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
  btnText:     { color: '#fff', fontSize: 16, fontWeight: '800' },
});
