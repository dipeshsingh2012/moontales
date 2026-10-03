/**
 * ElevenLabsService
 *
 * Handles voice cloning operations with ElevenLabs API.
 * Allows uploading audio samples and managing voice cloning.
 */

import * as FileSystem from 'expo-file-system';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export interface VoiceCloneOptions {
  name: string;
  description?: string;
  files: File[]; // Will be adapted for React Native
}

export interface VoiceCloneResult {
  voice_id: string;
  name: string;
  description?: string;
}

export class ElevenLabsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Clone a voice from an audio file
   * @param fileUri Local file URI of the audio sample
   * @param voiceName Name for the cloned voice
   * @returns Voice ID of the cloned voice
   */
  async cloneVoice(fileUri: string, voiceName: string): Promise<string> {
    try {
      // Read the file as base64
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create form data for the request using React Native's approach
      const formData = new FormData();
      formData.append('name', voiceName);
      formData.append('files', {
        uri: fileUri,
        type: 'audio/mpeg',
        name: 'voice_sample.mp3',
      } as any);

      const response = await fetch(`${ELEVENLABS_API_BASE}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          // Don't set Content-Type manually - let the browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || 'Failed to clone voice');
      }

      const result = await response.json();
      return result.voice_id;
    } catch (error) {
      console.error('Voice cloning error:', error);
      throw error;
    }
  }

  /**
   * Get all voices for the account
   */
  async getVoices(): Promise<any[]> {
    try {
      const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      throw error;
    }
  }

  /**
   * Delete a voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    try {
      const response = await fetch(`${ELEVENLABS_API_BASE}/voices/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete voice');
      }
    } catch (error) {
      console.error('Error deleting voice:', error);
      throw error;
    }
  }

  /**
   * Get voice settings/details
   */
  async getVoiceSettings(voiceId: string): Promise<any> {
    try {
      const response = await fetch(`${ELEVENLABS_API_BASE}/voices/${voiceId}/settings`, {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch voice settings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching voice settings:', error);
      throw error;
    }
  }
}