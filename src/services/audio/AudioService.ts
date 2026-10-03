/**
 * AudioService
 *
 * Manages audio playback using expo-audio for local cached or remote audio files.
 * Provides playback controls and progress tracking for karaoke-style highlighting.
 */

import { createAudioPlayer, setAudioModeAsync, AudioPlayer, AudioStatus } from 'expo-audio';

export interface AudioState {
  isPlaying: boolean;
  isLoaded: boolean;
  duration: number; // in milliseconds
  position: number; // in milliseconds
  currentTime: number; // in milliseconds
}

export class AudioService {
  private player: AudioPlayer | null = null;
  private statusSubscription: { remove: () => void } | null = null;
  private isLoaded: boolean = false;
  private isPlaying: boolean = false;
  private playbackPosition: number = 0;
  private duration: number = 0;
  private listeners: Set<(state: AudioState) => void> = new Set();

  constructor() {
    this.setupAudio();
  }

  private async setupAudio() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
    } catch (err) {
      console.warn('[AudioService] Could not configure audio mode:', err);
    }
  }

  /**
   * Load audio from local file path or remote URL
   */
  async loadAudio(filePath: string): Promise<void> {
    try {
      await this.unloadAudio();

      if (!filePath) return;

      this.player = createAudioPlayer(filePath, {
        updateInterval: 50, // 50ms for smooth karaoke highlighting
      });

      this.statusSubscription = this.player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        this.onPlaybackStatusUpdate(status);
      });

      this.isLoaded = true;
      this.playbackPosition = 0;
      this.duration = Math.round((this.player.duration || 0) * 1000);
      this.isPlaying = false;
      this.notifyListeners();
    } catch (error) {
      console.error('[AudioService] Failed to load audio:', error);
      this.isLoaded = false;
      this.isPlaying = false;
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Play audio
   */
  async play(): Promise<void> {
    if (!this.player || !this.isLoaded) {
      console.warn('[AudioService] No audio loaded to play');
      return;
    }

    try {
      this.player.play();
      this.isPlaying = true;
      this.notifyListeners();
    } catch (error) {
      console.error('[AudioService] Failed to play audio:', error);
    }
  }

  /**
   * Pause audio
   */
  async pause(): Promise<void> {
    if (!this.player) return;

    try {
      this.player.pause();
      this.isPlaying = false;
      this.notifyListeners();
    } catch (error) {
      console.error('[AudioService] Failed to pause audio:', error);
    }
  }

  /**
   * Stop audio and reset position
   */
  async stop(): Promise<void> {
    if (!this.player) return;

    try {
      this.player.pause();
      await this.player.seekTo(0);
      this.playbackPosition = 0;
      this.isPlaying = false;
      this.notifyListeners();
    } catch (error) {
      console.error('[AudioService] Failed to stop audio:', error);
    }
  }

  /**
   * Seek to specific position (in milliseconds)
   */
  async seekTo(positionMs: number): Promise<void> {
    if (!this.player) return;

    try {
      const seconds = Math.max(0, positionMs / 1000);
      await this.player.seekTo(seconds);
      this.playbackPosition = positionMs;
      this.notifyListeners();
    } catch (error) {
      console.error('[AudioService] Failed to seek audio:', error);
    }
  }

  /**
   * Get current playback state
   */
  getState(): AudioState {
    return {
      isPlaying: this.isPlaying,
      isLoaded: this.isLoaded,
      duration: this.duration,
      position: this.playbackPosition,
      currentTime: this.playbackPosition,
    };
  }

  /**
   * Unload current audio
   */
  async unloadAudio(): Promise<void> {
    if (this.statusSubscription) {
      this.statusSubscription.remove();
      this.statusSubscription = null;
    }

    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch (e) {
        // ignore cleanup error
      }
      this.player = null;
    }

    this.isLoaded = false;
    this.isPlaying = false;
    this.playbackPosition = 0;
    this.duration = 0;
    this.notifyListeners();
  }

  /**
   * Subscribe to audio state changes
   */
  subscribe(listener: (state: AudioState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private onPlaybackStatusUpdate = (status: AudioStatus) => {
    if (!status) return;

    const currentMs = Math.round((status.currentTime || 0) * 1000);
    const durMs = Math.round((status.duration || 0) * 1000);

    this.playbackPosition = currentMs;
    if (durMs > 0) {
      this.duration = durMs;
    }
    this.isLoaded = Boolean(status.isLoaded);
    this.isPlaying = Boolean(status.playing);

    if (status.didJustFinish) {
      this.isPlaying = false;
    }

    this.notifyListeners({
      isPlaying: this.isPlaying,
      isLoaded: this.isLoaded,
      duration: this.duration,
      position: this.playbackPosition,
      currentTime: this.playbackPosition,
    });
  };

  private notifyListeners(state?: AudioState) {
    const currentState = state || this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('[AudioService] Error in listener:', err);
      }
    });
  }

  /**
   * Cleanup
   */
  async cleanup() {
    await this.unloadAudio();
    this.listeners.clear();
  }
}