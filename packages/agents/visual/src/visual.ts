import type { LLMProvider } from '@qaforge/providers';
import { captureBaseline, captureCurrentScreenshot, getBaselineBuffer } from './baseline';
import { diffImages, saveDiffImage } from './differ';
import { classifyDiff, type Classification } from './classifier';

export interface VisualOptions {
  url: string;
  name: string;
  provider: LLMProvider;
  update?: boolean;
  baselineDir?: string;
  diffDir?: string;
  threshold?: number;
  headless?: boolean;
}

export interface VisualResult {
  name: string;
  status: 'created' | 'passed' | 'failed' | 'warned';
  diffPercentage?: number;
  diffImagePath?: string;
  classification?: Classification;
}

export async function checkVisual(options: VisualOptions): Promise<VisualResult> {
  const { url, name, provider, update = false, threshold = 0.2, headless = true } = options;

  if (update) {
    await captureBaseline({ url, name, baselineDir: options.baselineDir, headless });
    return { name, status: 'created' };
  }

  const existing = getBaselineBuffer(name, options.baselineDir);
  if (!existing) {
    await captureBaseline({ url, name, baselineDir: options.baselineDir, headless });
    return { name, status: 'created' };
  }

  const current = await captureCurrentScreenshot({ url, name, headless });
  const { percentage, diffBuffer } = diffImages(existing, current);

  if (percentage <= threshold) {
    return { name, status: 'passed', diffPercentage: percentage };
  }

  const diffImagePath = saveDiffImage(diffBuffer, name, options.diffDir);
  const classification = await classifyDiff(provider, existing, current, percentage);
  const status = classification.recommendation === 'fail' ? 'failed' : 'warned';

  return { name, status, diffPercentage: percentage, diffImagePath, classification };
}
