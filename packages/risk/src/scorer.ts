import type { RunHistory } from './history';
import { changedFilesToSegments } from './git-diff';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TestPriority {
  testFile: string;
  score: number;
  level: RiskLevel;
  reasons: string[];
}

export interface ScorerOptions {
  changedFiles?: string[];
  history: RunHistory;
  w1?: number;
  w2?: number;
  w3?: number;
}

const BUSINESS_CRITICAL = /auth|login|payment|checkout|register|password|token/i;

const LEVEL_ORDER: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

function levelFromScore(score: number): RiskLevel {
  if (score >= 0.75) return 'critical';
  if (score >= 0.5) return 'high';
  if (score >= 0.25) return 'medium';
  return 'low';
}

export function scoreTests(testFiles: string[], options: ScorerOptions): TestPriority[] {
  const { changedFiles = [], history, w1 = 0.4, w2 = 0.4, w3 = 0.2 } = options;
  const segments = changedFilesToSegments(changedFiles);

  return testFiles.map((testFile) => {
    const reasons: string[] = [];
    const normalized = testFile.replace(/\\/g, '/');

    const changeImpact = segments.some((seg) => normalized.includes(seg)) ? 1 : 0;
    if (changeImpact) reasons.push('related file changed in git diff');

    const historicalFailure = history.flakinessScore(testFile);
    if (historicalFailure > 0) reasons.push(`flakiness ${Math.round(historicalFailure * 100)}%`);

    const businessRisk = BUSINESS_CRITICAL.test(normalized) ? 1 : 0.2;
    if (businessRisk >= 1) reasons.push('business-critical path');

    const score = w1 * changeImpact + w2 * historicalFailure + w3 * businessRisk;
    return { testFile, score, level: levelFromScore(score), reasons };
  });
}

export function filterByMinPriority(
  priorities: TestPriority[],
  minLevel: RiskLevel,
): TestPriority[] {
  const minIdx = LEVEL_ORDER.indexOf(minLevel);
  return priorities
    .filter((p) => LEVEL_ORDER.indexOf(p.level) >= minIdx)
    .sort((a, b) => b.score - a.score);
}
