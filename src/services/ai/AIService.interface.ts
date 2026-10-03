import { Story, StoryGenerationOptions } from '../../types';

export interface IAIService {
  generateStory(options: StoryGenerationOptions): Promise<Story>;
  generateIllustration(prompt: string): Promise<string>;
  getProviderName(): string;
}
