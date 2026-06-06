import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import type { LLMProvider } from '@qaforge/providers';
import { LocatorStore } from '../store';

const mockHealResponse = {
  candidates: [
    {
      locator: "page.getByRole('button', { name: 'Sign in' })",
      strategy: 'role',
      confidence: 0.95,
      rationale: "Button text changed from 'Login' to 'Sign in'",
    },
  ],
  summary: "The login button was renamed from 'Login' to 'Sign in'",
};

describe('LocatorStore', () => {
  it('saves and retrieves a locator entry', () => {
    const storeDir = join(tmpdir(), 'qaforge-healer-test-' + Date.now());
    const store = new LocatorStore(storeDir);

    store.save({
      original: "page.getByRole('button', { name: 'Login' })",
      healed: "page.getByRole('button', { name: 'Sign in' })",
      confidence: 0.95,
      url: 'http://localhost:3000',
      timestamp: new Date().toISOString(),
    });

    const found = store.findCached("page.getByRole('button', { name: 'Login' })");
    expect(found?.healed).toBe("page.getByRole('button', { name: 'Sign in' })");
  });

  it('returns undefined for unknown locators', () => {
    const storeDir = join(tmpdir(), 'qaforge-healer-test-empty-' + Date.now());
    const store = new LocatorStore(storeDir);
    expect(store.findCached('page.getByRole("button")')).toBeUndefined();
  });
});

describe('HealResponse schema', () => {
  it('validates a correct heal response', async () => {
    const { HealResponseSchema } = await import('../prompt');
    const result = HealResponseSchema.parse(mockHealResponse);
    expect(result.candidates[0]?.confidence).toBe(0.95);
  });

  it('rejects confidence outside 0-1', async () => {
    const { HealResponseSchema } = await import('../prompt');
    expect(() =>
      HealResponseSchema.parse({
        ...mockHealResponse,
        candidates: [{ ...mockHealResponse.candidates[0], confidence: 1.5 }],
      })
    ).toThrow();
  });
});
