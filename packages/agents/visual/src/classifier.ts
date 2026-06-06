import { z } from 'zod';
import type { LLMProvider } from '@qaforge/providers';

export const ClassificationSchema = z.object({
  isMeaningfulRegression: z.boolean(),
  confidence: z.number().min(0).max(1),
  category: z.enum(['layout', 'content', 'color', 'missing-element', 'noise', 'anti-aliasing']),
  description: z.string(),
  recommendation: z.enum(['fail', 'warn', 'ignore']),
});

export type Classification = z.infer<typeof ClassificationSchema>;

const SYSTEM_PROMPT = `You are a visual QA expert. Analyze two screenshots (baseline vs current) and classify pixel differences.
Distinguish meaningful regressions (layout shifts, missing elements, wrong colors) from harmless noise (anti-aliasing, subpixel rendering, font hinting).
Return ONLY valid JSON matching the schema — no markdown.`;

export async function classifyDiff(
  provider: LLMProvider,
  baselineBuffer: Buffer,
  currentBuffer: Buffer,
  percentage: number,
): Promise<Classification> {
  if (!provider.vision) {
    return fallbackClassification(percentage);
  }

  try {
    const raw = await provider.vision({
      prompt: `Baseline vs current screenshots have a ${percentage.toFixed(2)}% pixel difference. Is this a meaningful UI regression? Return JSON: { "isMeaningfulRegression": bool, "confidence": 0-1, "category": "layout|content|color|missing-element|noise|anti-aliasing", "description": "string", "recommendation": "fail|warn|ignore" }`,
      images: [baselineBuffer, currentBuffer],
    });
    const parsed = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw));
    return ClassificationSchema.parse(parsed);
  } catch {
    return fallbackClassification(percentage);
  }
}

function fallbackClassification(percentage: number): Classification {
  if (percentage > 2) {
    return { isMeaningfulRegression: true, confidence: 0.5, category: 'layout', description: 'Diff exceeds 2% threshold (no vision provider)', recommendation: 'warn' };
  }
  return { isMeaningfulRegression: false, confidence: 0.6, category: 'noise', description: 'Diff within noise threshold (no vision provider)', recommendation: 'ignore' };
}
