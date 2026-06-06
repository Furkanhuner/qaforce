import { describe, expect, it } from 'vitest';
import { defineConfig, QAConfigSchema } from '../config';

const validConfig = {
  project: { name: 'test-project' },
  targets: { web: { baseUrl: 'https://example.com' } },
  ai: {
    provider: 'anthropic' as const,
    model: 'claude-3-5-sonnet-20241022',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
};

describe('defineConfig', () => {
  it('accepts valid config', () => {
    const result = defineConfig(validConfig);
    expect(result.project.name).toBe('test-project');
  });

  it('applies default browser list', () => {
    const result = defineConfig(validConfig);
    expect(result.targets.web?.browsers).toEqual(['chromium']);
  });

  it('applies defaults for locators when provided', () => {
    const result = defineConfig({
      ...validConfig,
      locators: { strategy: ['role', 'label', 'testId', 'text'], selfHeal: 'suggest' },
    });
    expect(result.locators?.selfHeal).toBe('suggest');
  });

  it('rejects an unknown provider', () => {
    expect(() =>
      QAConfigSchema.parse({ ...validConfig, ai: { ...validConfig.ai, provider: 'gpt' } })
    ).toThrow();
  });

  it('rejects an invalid baseUrl', () => {
    expect(() =>
      QAConfigSchema.parse({ ...validConfig, targets: { web: { baseUrl: 'not-a-url' } } })
    ).toThrow();
  });

  it('accepts optional istqb config', () => {
    const result = defineConfig({
      ...validConfig,
      istqb: { traceability: true, techniques: ['BVA', 'EP'] },
    });
    expect(result.istqb?.traceability).toBe(true);
  });
});
