import { chromium } from 'playwright';
import type { LLMProvider } from '@qaforge/providers';
import { HEALER_SYSTEM_PROMPT, HealResponseSchema, buildHealerPrompt } from './prompt';
import type { HealCandidate } from './prompt';
import { LocatorStore } from './store';

export interface HealOptions {
  url: string;
  brokenLocator: string;
  provider: LLMProvider;
  storeDir?: string;
  headless?: boolean;
}

export interface HealResult {
  top: HealCandidate;
  all: HealCandidate[];
  summary: string;
}

export async function healLocator(options: HealOptions): Promise<HealResult> {
  const { url, brokenLocator, provider, storeDir, headless = true } = options;
  const store = new LocatorStore(storeDir);

  // Return cached result if available
  const cached = store.findCached(brokenLocator);
  if (cached) {
    console.log(`ℹ  Using cached heal (confidence: ${Math.round(cached.confidence * 100)}%)`);
    return {
      top: {
        locator: cached.healed,
        strategy: 'role',
        confidence: cached.confidence,
        rationale: 'Previously healed and stored',
      },
      all: [],
      summary: 'Loaded from locator-store cache.',
    };
  }

  // Capture accessibility snapshot from live page
  console.log(`🔍  Navigating to ${url} to capture accessibility snapshot...`);
  const browser = await chromium.launch({ headless });
  let a11ySnapshotStr = '';

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    a11ySnapshotStr = await page.locator('body').ariaSnapshot();
  } finally {
    await browser.close();
  }

  // Call LLM for healing
  console.log('⚙  Calling LLM to find best matching locator...');
  const raw = await provider.complete({
    system: HEALER_SYSTEM_PROMPT,
    prompt: buildHealerPrompt(brokenLocator, a11ySnapshotStr, url),
    schema: HealResponseSchema,
  });

  const response = HealResponseSchema.parse(raw);
  const top = response.candidates[0];
  if (!top) throw new Error('LLM returned no heal candidates');

  // Persist result
  store.save({
    original: brokenLocator,
    healed: top.locator,
    confidence: top.confidence,
    url,
    timestamp: new Date().toISOString(),
  });

  return { top, all: response.candidates, summary: response.summary };
}
