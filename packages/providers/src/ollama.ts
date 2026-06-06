import type { LLMCompleteInput, LLMProvider } from './provider';

export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';

  async complete(_input: LLMCompleteInput): Promise<string> {
    throw new Error(
      'OllamaProvider is not yet implemented. Set ai.provider = "anthropic" in qa.config.ts.'
    );
  }
}
