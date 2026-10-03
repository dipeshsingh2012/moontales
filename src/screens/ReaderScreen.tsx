import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { AudioService } from '../services/audio';
import { Story, StoryPage } from '../types';
import { KaraokeText } from '../components/KaraokeText';

interface ReaderScreenProps {
  story: Story;
  onBack: () => void;
}

export const ReaderScreen: React.FC<ReaderScreenProps> = ({ story, onBack }) => {
  const pages: StoryPage[] = story.pages || [];
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackPositionMs, setPlaybackPositionMs] = useState<number>(0);
  const [audioDurationMs, setAudioDurationMs] = useState<number>(0);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  const audioServiceRef = useRef<AudioService | null>(null);
  const currentPage = pages[currentPageIndex];

  useEffect(() => {
    const service = new AudioService();
    audioServiceRef.current = service;

    const unsubscribe = service.subscribe((state) => {
      setPlaybackPositionMs(state.position);
      setAudioDurationMs(state.duration);
      setIsPlaying(state.isPlaying);
    });

    return () => {
      unsubscribe();
      service.cleanup();
    };
  }, []);

  useEffect(() => {
    setImageLoading(true);
    const audioUri = currentPage?.local_audio_path || currentPage?.audio_url;
    if (!currentPage || !audioUri || !audioServiceRef.current) return;
    audioServiceRef.current
      .loadAudio(audioUri)
      .then(() => {
        return audioServiceRef.current?.play();
      })
      .catch((err) => {
        console.warn('Audio playback error:', err);
      });
  }, [currentPageIndex]);

  const togglePlayback = async () => {
    if (!audioServiceRef.current) return;
    if (isPlaying) {
      await audioServiceRef.current.pause();
    } else {
      await audioServiceRef.current.play();
    }
  };

  const restartAudio = async () => {
    if (!audioServiceRef.current) return;
    await audioServiceRef.current.seekTo(0);
    await audioServiceRef.current.play();
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  if (!currentPage) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No pages available in this story.</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={onBack}>
          <Text style={styles.navButtonText}>← Library</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {story.title || 'Bedtime Story'}
        </Text>
        <Text style={styles.pageIndicator}>
          {currentPageIndex + 1} / {pages.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrapper}>
          {imageLoading && (
            <View style={styles.imageLoader}>
              <ActivityIndicator size="large" color="#FFD166" />
            </View>
          )}
          <Image
            source={{ uri: currentPage.local_image_path || currentPage.image_url }}
            style={styles.illustration}
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
        </View>

        <View style={styles.audioControls}>
          <TouchableOpacity style={styles.controlIcon} onPress={restartAudio}>
            <Text style={styles.controlIconText}>↺</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            <Text style={styles.playButtonText}>{isPlaying ? '⏸ Pause' : '▶ Listen'}</Text>
          </TouchableOpacity>
          <View style={styles.durationPill}>
            <Text style={styles.durationText}>
              {Math.floor(playbackPositionMs / 1000)}s / {Math.floor(audioDurationMs / 1000)}s
            </Text>
          </View>
        </View>

        <View style={styles.textCard}>
          <KaraokeText
            text={currentPage.text}
            alignment={currentPage.alignment}
            currentTimeMs={playbackPositionMs}
          />
        </View>

        <View style={styles.pageTurnRow}>
          <TouchableOpacity
            style={[styles.turnButton, currentPageIndex === 0 && styles.turnButtonDisabled]}
            disabled={currentPageIndex === 0}
            onPress={handlePrevPage}
          >
            <Text style={styles.turnButtonText}>← Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.turnButton,
              currentPageIndex === pages.length - 1 && styles.turnButtonDisabled,
            ]}
            disabled={currentPageIndex === pages.length - 1}
            onPress={handleNextPage}
          >
            <Text style={styles.turnButtonText}>Next →</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#242038',
  },
  headerTitle: {
    color: '#FFFFFE',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  navButton: {
    padding: 6,
  },
  navButtonText: {
    color: '#FFD166',
    fontWeight: '600',
    fontSize: 14,
  },
  pageIndicator: {
    color: '#A7A9BE',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1E1B2E',
    marginBottom: 16,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1B2E',
    zIndex: 1,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  playButton: {
    backgroundColor: '#FFD166',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  playButtonText: {
    color: '#0F0E17',
    fontSize: 16,
    fontWeight: '700',
  },
  controlIcon: {
    backgroundColor: '#242038',
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconText: {
    color: '#FFD166',
    fontSize: 20,
    fontWeight: 'bold',
  },
  durationPill: {
    backgroundColor: '#242038',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  durationText: {
    color: '#A7A9BE',
    fontSize: 13,
  },
  textCard: {
    width: '100%',
    backgroundColor: 'rgba(36, 32, 56, 0.75)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  pageTurnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  turnButton: {
    backgroundColor: '#242038',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.3)',
  },
  turnButtonDisabled: {
    opacity: 0.35,
    borderColor: 'transparent',
  },
  turnButtonText: {
    color: '#FFD166',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 20,
    padding: 12,
  },
  backButtonText: {
    color: '#FFD166',
    fontSize: 16,
  },
});
