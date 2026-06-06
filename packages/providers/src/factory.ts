import type { QAConfig } from '@qaforge/core';
import { AnthropicProvider } from './anthropic';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';
import type { LLMProvider } from './provider';

export function createProvider(config: QAConfig): LLMProvider {
  switch (config.ai.provider) {
    case 'anthropic':
      return new AnthropicProvider(config.ai);
    case 'openai':
      return new OpenAIProvider();
    case 'ollama':
      return new OllamaProvider();
    default: {
      const exhaustive: never = config.ai.provider;
      throw new Error(`Unknown provider: ${exhaustive as string}`);
    }
  }
}
