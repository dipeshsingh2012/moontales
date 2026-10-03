import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '../../types';

export class StorageService {
  private static readonly STORIES_KEY = '@moontales_stories';

  static async saveStory(story: Story): Promise<void> {
    try {
      const existingStories = await this.getStories();
      const updatedStories = [...existingStories, story];
      await AsyncStorage.setItem(this.STORIES_KEY, JSON.stringify(updatedStories));
      console.log('Story saved:', story.title);
    } catch (error) {
      console.error('Error saving story:', error);
      throw error;
    }
  }

  static async getStories(): Promise<Story[]> {
    try {
      const storiesJson = await AsyncStorage.getItem(this.STORIES_KEY);
      if (!storiesJson) {
        return [];
      }
      const stories = JSON.parse(storiesJson);
      // Convert date strings back to Date objects
      return stories.map((story: any) => ({
        ...story,
        metadata: {
          ...story.metadata,
          createdAt: new Date(story.metadata.createdAt)
        }
      }));
    } catch (error) {
      console.error('Error getting stories:', error);
      return [];
    }
  }

  static async deleteStory(storyId: string): Promise<void> {
    try {
      const existingStories = await this.getStories();
      const updatedStories = existingStories.filter(s => s.id !== storyId);
      await AsyncStorage.setItem(this.STORIES_KEY, JSON.stringify(updatedStories));
      console.log('Story deleted:', storyId);
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }

  static async toggleFavorite(storyId: string): Promise<void> {
    try {
      const existingStories = await this.getStories();
      const updatedStories = existingStories.map(s => 
        s.id === storyId ? { ...s, isFavorite: !s.isFavorite } : s
      );
      await AsyncStorage.setItem(this.STORIES_KEY, JSON.stringify(updatedStories));
      console.log('Favorite toggled for story:', storyId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  static async clearAllStories(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORIES_KEY);
      console.log('All stories cleared');
    } catch (error) {
      console.error('Error clearing stories:', error);
      throw error;
    }
  }
}
