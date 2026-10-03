/**
 * StoryContext — wires the app to the MoonTales FastAPI backend.
 *
 * generateStory:
 *   1. POST /api/story  → receive {id, status:'pending'}
 *   2. Poll GET /api/story/{id} every 4 s until status=completed|failed
 *   3. Merge the completed Story into the local library list
 *
 * Library CRUD (list / delete / favorite) is also backed by the API.
 * Favorites are tracked locally in AsyncStorage so they survive URL expiry.
 */

import React, {
  createContext, useContext, useEffect,
  useRef, useState, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Story, StoryGenerationOptions, UserPreferences } from '../types';
import * as MoontalesApi from '../services/api/MoontalesApiService';
import { PreferencesService } from '../services/storage/PreferencesService';
import { cacheStoryAssets as cacheStoryAssetsService } from '../services/assets';
import { useAuth } from './AuthContext';

// ── Favorites — stored locally so they survive token / URL rotation ───────────
const FAV_KEY = '@moontales_favorites';

async function loadFavs(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(FAV_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

async function saveFavs(ids: Set<string>) {
  await AsyncStorage.setItem(FAV_KEY, JSON.stringify([...ids])).catch(() => {});
}

// ── Context type ──────────────────────────────────────────────────────────────

interface StoryContextType {
  currentStory: Story | null;
  isLoading: boolean;
  generationStatus: string;   // human-readable progress message
  error: string | null;
  userPreferences: UserPreferences;
  stories: Story[];           // cached library list
  isCachingAssets: boolean;  // true while downloading assets locally

  generateStory: (options: StoryGenerationOptions) => Promise<void>;
  setCurrentStory: (story: Story | null) => void;
  updateUserPreferences: (p: Partial<UserPreferences>) => Promise<void>;
  refreshLibrary: () => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  toggleFavorite: (storyId: string) => Promise<void>;
  updateTitle: (storyId: string, title: string) => Promise<void>;
  cacheStoryAssets: (story: Story) => Promise<Story>;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

const defaultPreferences: UserPreferences = {
  childName: '',
  preferredThemes: [],
  defaultStoryLength: 'medium',
  voiceId: '',
  theme: 'light',
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function StoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [currentStory,      setCurrentStory]      = useState<Story | null>(null);
  const [isLoading,         setIsLoading]          = useState(false);
  const [generationStatus,  setGenerationStatus]   = useState('');
  const [error,             setError]              = useState<string | null>(null);
  const [userPreferences,   setUserPreferences]    = useState<UserPreferences>(defaultPreferences);
  const [stories,           setStories]            = useState<Story[]>([]);
  const [favorites,         setFavorites]          = useState<Set<string>>(new Set());
  const [isCachingAssets,   setIsCachingAssets]    = useState(false);

  const favRef = useRef<Set<string>>(new Set());

  // Load saved prefs + favorites on mount
  useEffect(() => {
    PreferencesService.loadPreferences()
      .then((saved) => setUserPreferences(saved as UserPreferences))
      .catch(() => {});

    loadFavs().then((favs) => {
      favRef.current = favs;
      setFavorites(new Set(favs));
    });
  }, []);

  // Load library whenever user signs in
  useEffect(() => {
    if (user) refreshLibrary();
    else setStories([]);
  }, [user?.uid]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function applyFavorites(list: Story[]): Story[] {
    return list.map((s) => ({ ...s, isFavorite: favRef.current.has(s.id) }));
  }

  // ── Library ──────────────────────────────────────────────────────────────────

  const refreshLibrary = async () => {
    try {
      const list = await MoontalesApi.listStories();
      setStories(applyFavorites(list));
    } catch (e) {
      console.warn('Could not refresh library:', e);
    }
  };

  // ── Generate ──────────────────────────────────────────────────────────────────

  const generateStory = async (options: StoryGenerationOptions) => {
    if (!user) { setError('You must be signed in to generate a story.'); return; }

    setIsLoading(true);
    setError(null);
    setGenerationStatus('Submitting your story idea…');

    try {
      const voiceId = userPreferences.voiceId;
      const { id } = await MoontalesApi.createStory(user.uid, options, voiceId);

      setGenerationStatus('Writing your bedtime adventure…');

      // 1. Wait until Page 1 is ready so the child can immediately read and listen!
      const initialStory = await MoontalesApi.pollUntilReady(
        id,
        (intermediate) => {
          if (intermediate.title) {
            setGenerationStatus(`Writing "${intermediate.title}"…`);
          } else if (intermediate.status === 'generating') {
            setGenerationStatus('Painting illustrations & recording bedtime narration…');
          }
        },
        2000,
        180_000,
      );

      const withFav = { ...initialStory, isFavorite: favRef.current.has(initialStory.id) };
      setCurrentStory(withFav);
      setStories((prev) => [withFav, ...prev.filter((s) => s.id !== withFav.id)]);
      setIsLoading(false);
      setGenerationStatus('');

      // 2. If not all pages are completed yet, continue background polling to stream subsequent pages
      if (initialStory.status !== 'completed') {
        MoontalesApi.pollUntilComplete(
          id,
          (streamUpdate) => {
            const updatedWithFav = { ...streamUpdate, isFavorite: favRef.current.has(streamUpdate.id) };
            setCurrentStory((curr) => (curr?.id === streamUpdate.id ? updatedWithFav : curr));
            setStories((prev) => [updatedWithFav, ...prev.filter((s) => s.id !== updatedWithFav.id)]);
          },
          2500,
          300_000,
        ).then(async (completedStory) => {
          const finalWithFav = { ...completedStory, isFavorite: favRef.current.has(completedStory.id) };
          setCurrentStory((curr) => (curr?.id === completedStory.id ? finalWithFav : curr));
          setStories((prev) => [finalWithFav, ...prev.filter((s) => s.id !== finalWithFav.id)]);

          // Background asset caching once complete
          try {
            const cached = await cacheStoryAssetsService(finalWithFav);
            setCurrentStory((curr) => (curr?.id === cached.id ? cached : curr));
            setStories((prev) => [cached, ...prev.filter((s) => s.id !== cached.id)]);
          } catch (cErr) {
            console.warn('Background asset caching skipped:', cErr);
          }
        }).catch((bErr) => {
          console.warn('Background page streaming error:', bErr);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Story generation failed.');
      setGenerationStatus('');
      setIsLoading(false);
    }
  };

  // ── Favorites ────────────────────────────────────────────────────────────────

  const toggleFavorite = async (storyId: string) => {
    const updated = new Set(favRef.current);
    if (updated.has(storyId)) updated.delete(storyId);
    else updated.add(storyId);

    favRef.current = updated;
    setFavorites(new Set(updated));
    await saveFavs(updated);

    setStories((prev) => prev.map((s) =>
      s.id === storyId ? { ...s, isFavorite: updated.has(storyId) } : s,
    ));
    if (currentStory?.id === storyId) {
      setCurrentStory((s) => s ? { ...s, isFavorite: updated.has(storyId) } : s);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const deleteStory = async (storyId: string) => {
    await MoontalesApi.deleteStory(storyId);
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    if (currentStory?.id === storyId) setCurrentStory(null);
  };

  // ── Update title ─────────────────────────────────────────────────────────────

  const updateTitle = async (storyId: string, title: string) => {
    const updated = await MoontalesApi.updateStoryTitle(storyId, title);
    setStories((prev) => prev.map((s) =>
      s.id === storyId ? { ...s, ...updated, isFavorite: s.isFavorite } : s,
    ));
    if (currentStory?.id === storyId) {
      setCurrentStory((s) => s ? { ...s, title } : s);
    }
  };

  // ── Preferences ──────────────────────────────────────────────────────────────

  const updateUserPreferences = async (prefs: Partial<UserPreferences>) => {
    const updated = { ...userPreferences, ...prefs };
    setUserPreferences(updated);
    PreferencesService.savePreferences(updated).catch(() => {});
  };

  // ── Asset Caching ─────────────────────────────────────────────────────────────

  const cacheStoryAssetsContext = async (story: Story): Promise<Story> => {
    setIsCachingAssets(true);
    try {
      const cached = await cacheStoryAssetsService(story);
      return cached;
    } finally {
      setIsCachingAssets(false);
    }
  };

  return (
    <StoryContext.Provider
      value={{
        currentStory, isLoading, generationStatus, error,
        userPreferences, stories, isCachingAssets,
        generateStory, setCurrentStory, updateUserPreferences,
        refreshLibrary, deleteStory, toggleFavorite, updateTitle,
        cacheStoryAssets: cacheStoryAssetsContext,
      }}
    >
      {children}
    </StoryContext.Provider>
  );
}

export function useStoryContext() {
  const ctx = useContext(StoryContext);
  if (!ctx) throw new Error('useStoryContext must be used within a StoryProvider');
  return ctx;
}
