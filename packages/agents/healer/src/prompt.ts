import { z } from 'zod';

export const HealCandidateSchema = z.object({
  locator: z.string().describe('Full Playwright locator expression, e.g. page.getByRole(...)'),
  strategy: z.enum(['role', 'label', 'text', 'testId', 'css']),
  confidence: z.number().min(0).max(1),
  rationale: z.string().describe('Why this locator matches the original intent'),
});

export const HealResponseSchema = z.object({
  candidates: z.array(HealCandidateSchema).min(1).max(5),
  summary: z.string().describe('Brief explanation of what changed on the page'),
});

export type HealResponse = z.infer<typeof HealResponseSchema>;
export type HealCandidate = z.infer<typeof HealCandidateSchema>;

export const HEALER_SYSTEM_PROMPT = `You are an expert QA engineer who fixes broken Playwright locators.

Locator priority (strictly follow):
1. getByRole (with exact role + name)
2. getByLabel
3. getByText
4. getByTestId
5. css locator — NEVER XPath

Given a broken locator and the current page accessibility tree, identify which element the original locator was targeting and suggest 1-3 replacement locators, best first.

Consider: renamed labels or button text, role changes, new aria attributes.

Return ONLY valid JSON matching the schema. No markdown, no extra text.`;

export function buildHealerPrompt(
  brokenLocator: string,
  a11ySnapshot: string,
  pageUrl: string
): string {
  const snapshot =
    a11ySnapshot.length > 8000 ? a11ySnapshot.slice(0, 8000) + '\n... [truncated]' : a11ySnapshot;

  return `Broken locator: ${brokenLocator}
Page URL: ${pageUrl}

Current page accessibility tree:
${snapshot}

The original locator no longer works. Identify the target element and suggest replacement locators.`;
}
