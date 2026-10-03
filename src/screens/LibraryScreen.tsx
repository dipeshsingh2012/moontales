import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStoryContext } from '../context/StoryContext';
import { Story } from '../types';

export interface LibraryScreenProps {
  onSelectStory?: (story: Story) => void;
  onNewStory?: () => void;
  navigation?: any;
  route?: any;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  onSelectStory,
  onNewStory,
}) => {
  const nav = useNavigation<any>();
  const {
    setCurrentStory,
    stories,
    refreshLibrary,
    deleteStory,
    isLoading: loading,
  } = useStoryContext();
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    refreshLibrary();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLibrary();
    setRefreshing(false);
  };

  const handleDelete = (storyId: string) => {
    Alert.alert('Delete Story', 'Are you sure you want to remove this bedtime story?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStory(storyId);
          } catch (err: any) {
            Alert.alert('Delete Failed', err.message);
          }
        },
      },
    ]);
  };

  const handleSelectStory = (story: Story) => {
    if (onSelectStory) {
      onSelectStory(story);
    } else {
      setCurrentStory(story);
      nav.navigate('StoryView');
    }
  };

  const handleNewStory = () => {
    if (onNewStory) {
      onNewStory();
    } else {
      nav.navigate('Create');
    }
  };

  const renderItem = ({ item }: { item: Story }) => {
    const isReady = item.status === 'completed';
    const dateFormatted = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.storyCard}
        onPress={() => isReady && handleSelectStory(item)}
        disabled={!isReady}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.storyTitle} numberOfLines={1}>
            {item.title || 'Untitled Bedtime Story'}
          </Text>
          <View
            style={[
              styles.statusBadge,
              isReady ? styles.statusBadgeReady : styles.statusBadgePending,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isReady ? styles.statusTextReady : styles.statusTextPending,
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.cardMeta}>
          {item.page_count} Pages · {dateFormatted}
        </Text>

        <View style={styles.cardActions}>
          {isReady ? (
            <Text style={styles.readText}>▶ Read & Listen</Text>
          ) : (
            <Text style={styles.pendingText}>Processing...</Text>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Story Library</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleNewStory}>
          <Text style={styles.createButtonText}>+ New Story</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFD166" />
        </View>
      ) : stories.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No Stories Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first magical bedtime story today!
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={handleNewStory}>
            <Text style={styles.startBtnText}>Create a Story</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FFD166"
            />
          }
        />
      )}
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
    fontSize: 20,
    fontWeight: '800',
  },
  createButton: {
    backgroundColor: '#FFD166',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  createButtonText: {
    color: '#0F0E17',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  storyCard: {
    backgroundColor: '#1E1B2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D2845',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  storyTitle: {
    color: '#FFFFFE',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeReady: {
    backgroundColor: 'rgba(6, 214, 160, 0.15)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(255, 209, 102, 0.15)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusTextReady: {
    color: '#06D6A0',
  },
  statusTextPending: {
    color: '#FFD166',
  },
  cardMeta: {
    color: '#A7A9BE',
    fontSize: 13,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  readText: {
    color: '#FFD166',
    fontWeight: '700',
    fontSize: 14,
  },
  pendingText: {
    color: '#A7A9BE',
    fontSize: 13,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#FFFFFE',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#A7A9BE',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  startBtn: {
    backgroundColor: '#FFD166',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  startBtnText: {
    color: '#0F0E17',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default LibraryScreen;

