/**
 * MoontalesApiService
 *
 * Wraps all calls to the MoonTales FastAPI backend.
 * Auth: every request attaches the Firebase ID token as a Bearer header.
 * Story creation is async — POST returns immediately; poll GET until completed.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Story, StoryGenerationOptions } from '../../types';

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }

  if (Platform.OS === 'android') {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host) {
        return `http://${host}:8000`;
      }
    }
    return 'http://10.0.2.2:8000';
  }

  return (envUrl || 'http://localhost:8000').replace(/\/+$/, '');
}

const BASE_URL = resolveBaseUrl();
console.log('[MoonTales API] Target Backend URL:', BASE_URL);

// Injected at runtime by AuthContext after sign-in.
let _getToken: (() => Promise<string>) | null = null;

export function setTokenProvider(fn: () => Promise<string>) {
  _getToken = fn;
}

async function authHeaders(): Promise<Record<string, string>> {
  let token = 'dev-token';
  if (_getToken) {
    try {
      const t = await _getToken();
      if (t) token = t;
    } catch {
      // fallback to dev-token in development
    }
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'bypass-tunnel-reminder': '1',
  };
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = 25000,
): Promise<T> {
  const headers = await authHeaders();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        detail = body.detail ?? detail;
      } catch {}
      throw new Error(detail);
    }
    if (res.status === 204) return undefined as unknown as T;
    return res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request to ${path} timed out. Ensure the backend is reachable at ${BASE_URL}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── Length → page_count mapping (fallback) ───────────────────────────────────

const LENGTH_TO_MINUTES: Record<string, number> = {
  short: 3,
  medium: 5,
  long: 10,
};

// ── Public API ────────────────────────────────────────────────────────────────

/** POST /api/story — returns {id, status:'pending'} immediately */
export async function createStory(
  userId: string,
  options: StoryGenerationOptions,
  voiceId?: string,
): Promise<{ id: string; status: string }> {
  const userCues: string[] = [];
  if (options.theme) userCues.push(options.theme);
  if (options.characters) userCues.push(...options.characters);

  const durationMinutes = options.duration_minutes ?? LENGTH_TO_MINUTES[options.length ?? 'medium'] ?? 5;

  const body: Record<string, any> = {
    user_id: userId,
    user_cues: userCues.length > 0 ? userCues : ['bedtime story'],
    prompt: options.prompt?.trim() || undefined,
    duration_minutes: durationMinutes,
  };

  if (voiceId && voiceId.trim()) {
    body.voice_id = voiceId.trim();
  }

  return apiRequest('/api/story', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** GET /api/story/{id} — full story once status=completed */
export async function getStory(storyId: string): Promise<Story> {
  return apiRequest(`/api/story/${storyId}`);
}

/** GET /api/stories — newest-first list for the authenticated user */
export async function listStories(): Promise<Story[]> {
  return apiRequest('/api/stories');
}

/** PUT /api/story/{id} — update title */
export async function updateStoryTitle(
  storyId: string,
  title: string,
): Promise<Story> {
  return apiRequest(`/api/story/${storyId}`, {
    method: 'PUT',
    body: JSON.stringify({ title }),
  });
}

/** DELETE /api/story/{id} — soft-delete */
export async function deleteStory(storyId: string): Promise<void> {
  return apiRequest(`/api/story/${storyId}`, { method: 'DELETE' });
}

/**
 * Polls until page 1 is ready, so the child can immediately begin reading/listening!
 * Resolves with the initial readable Story object.
 */
export async function pollUntilReady(
  storyId: string,
  onProgress?: (story: Story) => void,
  intervalMs = 2000,
  timeoutMs = 180_000,
): Promise<Story> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const story = await getStory(storyId);
    onProgress?.(story);

    if (story.status === 'failed') {
      throw new Error(story.error_message ?? 'Story generation failed.');
    }

    // Check if Page 1 is ready (has image & audio) or completed
    const hasPage1Ready = story.pages && story.pages.length > 0 && story.pages[0].ready;
    if (story.status === 'completed' || hasPage1Ready) {
      return story;
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Story generation timed out waiting for page 1.');
}

/**
 * Background poller to monitor until all pages are completed.
 */
export async function pollUntilComplete(
  storyId: string,
  onProgress?: (story: Story) => void,
  intervalMs = 2000,
  timeoutMs = 300_000,
): Promise<Story> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const story = await getStory(storyId);
    onProgress?.(story);
    if (story.status === 'completed') return story;
    if (story.status === 'failed') {
      throw new Error(story.error_message ?? 'Story generation failed.');
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Story generation timed out.');
}

