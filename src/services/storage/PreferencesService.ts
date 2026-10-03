// PreferencesService - stores all user preferences in AsyncStorage.
// NOTE: For a production/standalone build, the API key should be moved to
// expo-secure-store. In Expo Go (development), we use AsyncStorage for
// compatibility.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences } from '../../types';

const PREFS_KEY = 'moontales_user_prefs';

const defaultPreferences: UserPreferences = {
  childName: '',
  preferredThemes: [],
  defaultStoryLength: 'medium',
  voiceId: '',
  theme: 'light',
};

export class PreferencesService {
  /**
   * Load all user preferences from AsyncStorage.
   */
  static async loadPreferences(): Promise<UserPreferences> {
    try {
      const prefsJson = await AsyncStorage.getItem(PREFS_KEY);
      if (!prefsJson) return defaultPreferences;
      const saved: Partial<UserPreferences> = JSON.parse(prefsJson);
      return { ...defaultPreferences, ...saved };
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      return defaultPreferences;
    }
  }

  /**
   * Persist all user preferences to AsyncStorage.
   */
  static async savePreferences(prefs: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  }

  /**
   * Clear all stored preferences.
   */
  static async clearPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PREFS_KEY);
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      throw error;
    }
  }
}
