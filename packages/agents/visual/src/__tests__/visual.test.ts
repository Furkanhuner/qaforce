import { describe, it, expect } from 'vitest';
import { ClassificationSchema } from '../classifier';

describe('ClassificationSchema', () => {
  it('validates a meaningful regression result', () => {
    const result = ClassificationSchema.parse({
      isMeaningfulRegression: true,
      confidence: 0.92,
      category: 'layout',
      description: 'Header shifted 20px downward',
      recommendation: 'fail',
    });
    expect(result.isMeaningfulRegression).toBe(true);
    expect(result.recommendation).toBe('fail');
  });

  it('validates a noise result', () => {
    const result = ClassificationSchema.parse({
      isMeaningfulRegression: false,
      confidence: 0.8,
      category: 'anti-aliasing',
      description: 'Subpixel rendering difference',
      recommendation: 'ignore',
    });
    expect(result.category).toBe('anti-aliasing');
  });

  it('rejects invalid category', () => {
    expect(() =>
      ClassificationSchema.parse({
        isMeaningfulRegression: false,
        confidence: 0.5,
        category: 'unknown',
        description: 'test',
        recommendation: 'ignore',
      }),
    ).toThrow();
  });

  it('rejects confidence out of range', () => {
    expect(() =>
      ClassificationSchema.parse({
        isMeaningfulRegression: false,
        confidence: 1.5,
        category: 'noise',
        description: 'test',
        recommendation: 'ignore',
      }),
    ).toThrow();
  });
});
