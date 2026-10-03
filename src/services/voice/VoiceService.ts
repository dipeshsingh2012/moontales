// VoiceService - Real implementation using audio recording + OpenAI Whisper

export interface VoiceServiceCallbacks {
  onRecordingStart?: () => void;
  onRecordingStop?: (audioUri: string) => void;
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: string) => void;
}

export class VoiceService {
  private isRecording: boolean = false;
  private recording: any = null;
  private callbacks: VoiceServiceCallbacks = {};
  private whisperApiKey: string;

  constructor(callbacks?: VoiceServiceCallbacks, whisperApiKey: string = '') {
    this.callbacks = callbacks || {};
    this.whisperApiKey = whisperApiKey;
  }

  setApiKey(apiKey: string) {
    this.whisperApiKey = apiKey;
  }

  // Lazy-load audio recording module safely
  private async getAudio() {
    try {
      const audio = await import('expo-audio');
      return audio;
    } catch {
      throw new Error('Voice recording is not available on this device or Expo version.');
    }
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error('Already recording');
    }

    try {
      const Audio: any = await this.getAudio();

      const { status } = typeof Audio.requestRecordingPermissionsAsync === 'function'
        ? await Audio.requestRecordingPermissionsAsync()
        : await Audio.requestPermissionsAsync?.();
      if (status !== 'granted') {
        throw new Error('Microphone permission not granted. Please enable it in settings.');
      }

      if (typeof Audio.setAudioModeAsync === 'function') {
        await Audio.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        }).catch(() => {});
      }

      if (Audio.Recording?.createAsync) {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets?.HIGH_QUALITY || Audio.RecordingPresets?.HIGH_QUALITY
        );
        this.recording = recording;
      } else if (Audio.AudioRecorder) {
        this.recording = new Audio.AudioRecorder(
          Audio.RecordingPresets?.HIGH_QUALITY || {}
        );
        await this.recording.record();
      }

      this.isRecording = true;
      this.callbacks.onRecordingStart?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      this.callbacks.onError?.(message);
      throw error;
    }
  }

  async stopRecording(): Promise<string> {
    if (!this.isRecording || !this.recording) {
      throw new Error('Not recording');
    }

    try {
      const Audio: any = await this.getAudio();

      if (this.recording.stopAndUnloadAsync) {
        await this.recording.stopAndUnloadAsync();
      } else if (this.recording.stop) {
        await this.recording.stop();
      }

      if (typeof Audio.setAudioModeAsync === 'function') {
        await Audio.setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      }

      const uri = this.recording.getURI ? this.recording.getURI() : this.recording.uri;
      if (!uri) throw new Error('Failed to get recording URI');

      this.isRecording = false;
      this.recording = null;
      this.callbacks.onRecordingStop?.(uri);
      return uri;
    } catch (error) {
      this.isRecording = false;
      this.recording = null;
      const message = error instanceof Error ? error.message : 'Failed to stop recording';
      this.callbacks.onError?.(message);
      throw error;
    }
  }

  async transcribeAudio(audioUri: string): Promise<string> {
    if (!this.whisperApiKey) {
      throw new Error('No API key set. Add your OpenAI key in Settings to use voice input.');
    }

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.whisperApiKey}` },
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Whisper error (${response.status}): ${errorBody}`);
      }

      const data = await response.json();
      const transcription: string = data.text?.trim() || '';

      if (!transcription) {
        throw new Error('No speech detected. Please try again and speak clearly.');
      }

      this.callbacks.onTranscriptionComplete?.(transcription);
      return transcription;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Transcription failed';
      this.callbacks.onError?.(message);
      throw error;
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  async hasPermission(): Promise<boolean> {
    try {
      const Audio: any = await this.getAudio();
      const fn = Audio.getRecordingPermissionsAsync || Audio.getPermissionsAsync;
      if (!fn) return true;
      const { status } = await fn();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const Audio: any = await this.getAudio();
      const fn = Audio.requestRecordingPermissionsAsync || Audio.requestPermissionsAsync;
      if (!fn) return true;
      const { status } = await fn();
      return status === 'granted';
    } catch {
      return false;
    }
  }
}
