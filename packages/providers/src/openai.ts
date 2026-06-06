import type { LLMCompleteInput, LLMProvider, LLMVisionInput } from './provider';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';

  async complete(_input: LLMCompleteInput): Promise<string> {
    throw new Error(
      'OpenAIProvider is not yet implemented. Set ai.provider = "anthropic" in qa.config.ts.'
    );
  }

  async vision(_input: LLMVisionInput): Promise<string> {
    throw new Error('OpenAIProvider.vision is not yet implemented.');
  }
}
