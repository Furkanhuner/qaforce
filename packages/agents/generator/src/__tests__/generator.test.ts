import { readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import type { QAConfig } from '@qaforge/core';
import type { LLMProvider } from '@qaforge/providers';
import { generateTest } from '../generator';

const mockConfig: QAConfig = {
  project: { name: 'test' },
  targets: { web: { baseUrl: 'http://localhost:3000' } },
  ai: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', apiKeyEnv: 'ANTHROPIC_API_KEY' },
};

const mockGeneratedTest = {
  specName: 'loginHappyPath',
  domain: 'auth',
  description: 'User can log in with valid credentials',
  istqb: {
    level: 'system',
    type: 'functional',
    technique: ['EP', 'BVA'],
    risk: 'high',
  },
  tests: [
    {
      title: 'logs in with valid credentials',
      steps: [
        { action: 'goto', value: '/' },
        { action: 'fill', locator: { strategy: 'label', value: 'Email' }, value: 'test@example.com' },
        { action: 'fill', locator: { strategy: 'label', value: 'Password' }, value: 'password123' },
        {
          action: 'click',
          locator: { strategy: 'role', value: 'button', options: { name: 'Sign in' } },
        },
        { action: 'expect-visible', locator: { strategy: 'role', value: 'status' } },
      ],
    },
  ],
};

describe('generateTest', () => {
  it('calls provider and writes a .spec.ts file', async () => {
    const mockProvider: LLMProvider = {
      name: 'mock',
      complete: vi.fn().mockResolvedValue(mockGeneratedTest),
    };

    const tmpDir = join(tmpdir(), 'qaforge-test-' + Date.now());
    const filePath = await generateTest({
      prompt: 'User logs in with valid credentials',
      outputDir: tmpDir,
      config: mockConfig,
      provider: mockProvider,
    });

    expect(filePath).toContain('loginHappyPath.spec.ts');
    expect(mockProvider.complete).toHaveBeenCalledOnce();
  });

  it('generated file contains @istqb block and role-based locators', async () => {
    const mockProvider: LLMProvider = {
      name: 'mock',
      complete: vi.fn().mockResolvedValue(mockGeneratedTest),
    };

    const tmpDir = join(tmpdir(), 'qaforge-test2-' + Date.now());
    const filePath = await generateTest({
      prompt: 'login test',
      outputDir: tmpDir,
      config: mockConfig,
      provider: mockProvider,
    });

    const content = readFileSync(filePath, 'utf-8');
    expect(content).toContain('@istqb');
    expect(content).toContain('level: system');
    expect(content).toContain('getByRole');
    expect(content).toContain('getByLabel');
  });
});
