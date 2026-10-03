import { IAIService } from './AIService.interface';
import { Story, StoryGenerationOptions } from '../../types';

export class ClaudeService implements IAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateStory(options: StoryGenerationOptions): Promise<Story> {
    // TODO: Implement actual Claude API call
    // For now, return a mock story
    const story: Story = {
      id: Date.now().toString(),
      status: 'completed' as const,
      title: 'A Moonlit Journey',
      page_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
      pages: [
        {
          page_number: 1,
          text: 'Under the silver moonlight, a curious child set out on an extraordinary journey.',
          audio_text: 'Under the silver moonlight, a curious child set out on an extraordinary journey.',
          image_prompt: 'A child walking under a bright full moon',
          image_url: '', audio_url: '',
          alignment: { characters: [], character_start_times_ms: [], character_end_times_ms: [] },
          illustrationPrompt: 'A child walking under a bright full moon',
        },
        {
          page_number: 2,
          text: 'They followed a trail of stardust that led them to the edge of a mystical lake.',
          audio_text: 'They followed a trail of stardust that led them to the edge of a mystical lake.',
          image_prompt: 'A mystical lake under moonlight with stardust trails',
          image_url: '', audio_url: '',
          alignment: { characters: [], character_start_times_ms: [], character_end_times_ms: [] },
          illustrationPrompt: 'A mystical lake under moonlight with stardust trails',
        },
        {
          page_number: 3,
          text: 'There, they discovered that the stars were actually tiny fireflies dancing in the night sky.',
          audio_text: 'There, they discovered that the stars were actually tiny fireflies dancing in the night sky.',
          image_prompt: 'Fireflies forming constellations in the night sky',
          image_url: '', audio_url: '',
          alignment: { characters: [], character_start_times_ms: [], character_end_times_ms: [] },
          illustrationPrompt: 'Fireflies forming constellations in the night sky',
        },
      ],
      isFavorite: false,
      content: 'Under the silver moonlight...',
      metadata: {
        createdAt: new Date(),
        theme: options.theme || 'fantasy',
        characters: options.characters || [],
        length: options.length || 'medium',
        aiProvider: 'claude',
      },
    };

    return story;
  }

  async generateIllustration(prompt: string): Promise<string> {
    // TODO: Implement image generation (Claude doesn't generate images directly)
    // For now, return a placeholder URL
    return 'https://via.placeholder.com/400x300?text=Illustration';
  }

  getProviderName(): string {
    return 'Claude';
  }
}
