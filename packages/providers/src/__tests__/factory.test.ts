import { describe, expect, it } from 'vitest';
import { createProvider } from '../factory';
import type { QAConfig } from '@qaforge/core';

const baseConfig: QAConfig = {
  project: { name: 'test' },
  targets: { web: { baseUrl: 'https://example.com' } },
  ai: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', apiKeyEnv: 'ANTHROPIC_API_KEY' },
};

describe('createProvider', () => {
  it('returns AnthropicProvider for anthropic', () => {
    process.env['ANTHROPIC_API_KEY'] = 'test-key';
    const provider = createProvider(baseConfig);
    expect(provider.name).toBe('anthropic');
    delete process.env['ANTHROPIC_API_KEY'];
  });

  it('returns OpenAIProvider for openai', () => {
    const provider = createProvider({ ...baseConfig, ai: { ...baseConfig.ai, provider: 'openai' } });
    expect(provider.name).toBe('openai');
  });

  it('returns OllamaProvider for ollama', () => {
    const provider = createProvider({ ...baseConfig, ai: { ...baseConfig.ai, provider: 'ollama' } });
    expect(provider.name).toBe('ollama');
  });

  it('throws when ANTHROPIC_API_KEY is missing', () => {
    delete process.env['ANTHROPIC_API_KEY'];
    expect(() => createProvider(baseConfig)).toThrow('ANTHROPIC_API_KEY');
  });
});
