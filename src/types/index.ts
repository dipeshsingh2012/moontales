// ── API-aligned types (matches MoonTales FastAPI backend) ─────────────────────

export interface AlignmentData {
  characters: string[];
  character_start_times_ms: number[];
  character_end_times_ms: number[];
}

export interface StoryPage {
  page_number: number;
  text: string;
  audio_text: string;        // text with [laughs], [whispers] etc.
  image_prompt?: string;
  ready?: boolean;           // True when page media is ready
  image_url?: string | null; // signed GCS URL
  audio_url?: string | null; // signed GCS URL
  alignment?: AlignmentData | null; // character-level timing for karaoke highlight

  // Legacy compat & local caching
  imageUrl?: string;
  illustrationPrompt?: string;
  local_image_path?: string;
  local_audio_path?: string;
}

export type StoryStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface Story {
  id: string;
  user_id?: string;
  status: StoryStatus;
  title: string | null;
  page_count: number;
  pages_ready?: number;
  pages: StoryPage[] | null;
  created_at: string;   // ISO string from API
  updated_at: string;
  error_message: string | null;

  // Local-only extras (used by library / favorites)
  isFavorite?: boolean;

  // Legacy compat
  content?: string;
  metadata?: StoryMetadata;
}

// ── Legacy types (kept for MockAIService / StorageService compat) ─────────────

export interface StoryMetadata {
  createdAt: Date;
  theme: string;
  characters: string[];
  length: 'short' | 'medium' | 'long';
  aiProvider: string;
}

export interface UserPreferences {
  childName: string;
  preferredThemes: string[];
  defaultStoryLength: 'short' | 'medium' | 'long';
  voiceId: string;          // ElevenLabs voice ID
  theme: 'light' | 'dark';
  apiKey?: string;          // Legacy — used by VoiceService for speech-to-text
}

export interface StoryGenerationOptions {
  prompt: string;
  theme?: string;
  length?: 'short' | 'medium' | 'long';
  duration_minutes?: number;
  characters?: string[];
  cues?: string[];
}

