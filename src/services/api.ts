import { API_CONFIG } from '../config/api';
import { Story, StoryStatus } from '../types';

export interface CreateStoryPayload {
  userId?: string;
  userCues: string[];
  pageCount?: number;
  voiceId?: string;
}

export interface StoryStatusResponse {
  id: string;
  status: StoryStatus;
}

class ApiService {
  private baseUrl: string = API_CONFIG.BASE_URL;
  private token: string = API_CONFIG.DEV_TOKEN;
  private currentUserId: string = API_CONFIG.DEFAULT_USER_ID;

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public setToken(token: string) {
    this.token = token;
  }

  public setUserId(userId: string) {
    this.currentUserId = userId;
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
  }

  async checkHealth(): Promise<{ status: string; version: string }> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) {
      throw new Error(`Backend health check failed (${res.status})`);
    }
    return res.json();
  }

  async createStory(payload: CreateStoryPayload): Promise<StoryStatusResponse> {
    const userId = payload.userId || this.currentUserId;
    const body: Record<string, any> = {
      user_id: userId,
      user_cues: payload.userCues,
      page_count: payload.pageCount || 5,
    };

    if (payload.voiceId) {
      body.voice_id = payload.voiceId;
    }

    const res = await fetch(`${this.baseUrl}/api/story`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create story (${res.status}): ${err}`);
    }

    return res.json();
  }

  async getStory(storyId: string): Promise<Story> {
    const res = await fetch(`${this.baseUrl}/api/story/${storyId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to fetch story (${res.status}): ${err}`);
    }

    return res.json();
  }

  async listStories(userId?: string): Promise<Story[]> {
    const uid = userId || this.currentUserId;
    const res = await fetch(`${this.baseUrl}/api/stories?user_id=${encodeURIComponent(uid)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to list stories (${res.status}): ${err}`);
    }

    return res.json();
  }

  async updateStoryTitle(storyId: string, title: string): Promise<Story> {
    const res = await fetch(`${this.baseUrl}/api/story/${storyId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update story title (${res.status}): ${err}`);
    }

    return res.json();
  }

  async deleteStory(storyId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/story/${storyId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.text();
      throw new Error(`Failed to delete story (${res.status}): ${err}`);
    }
  }

  async pollStoryUntilComplete(
    storyId: string,
    onProgress?: (story: Story) => void,
    intervalMs: number = API_CONFIG.POLL_INTERVAL_MS,
    timeoutMs: number = API_CONFIG.POLL_TIMEOUT_MS
  ): Promise<Story> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const story = await this.getStory(storyId);
      if (onProgress) {
        onProgress(story);
      }

      if (story.status === 'completed') {
        return story;
      }

      if (story.status === 'failed') {
        throw new Error(story.error_message || 'Story generation failed.');
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Timed out waiting for story generation to complete.');
  }
}

export const api = new ApiService();
