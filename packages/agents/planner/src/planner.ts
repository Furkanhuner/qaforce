import * as fs from 'fs';
import * as path from 'path';
import type { LLMProvider } from '@qaforge/providers';
import { crawl } from './crawler';
import { PLANNER_SYSTEM_PROMPT, WorkflowMapSchema, type WorkflowMap } from './prompt';

export interface PlannerOptions {
  baseUrl: string;
  allowlist?: string[];
  maxDepth?: number;
  provider: LLMProvider;
  outputPath?: string;
  headless?: boolean;
}

export async function runPlanner(options: PlannerOptions): Promise<WorkflowMap> {
  const { baseUrl, allowlist = [], maxDepth = 2, provider, headless = true } = options;

  const pages = await crawl(baseUrl, allowlist, maxDepth, headless);
  console.log(`  Crawled ${pages.length} page(s)`);

  const crawlSummary = pages
    .map((p) => `## ${p.title}\nURL: ${p.url}\n\n${p.a11ySnapshot}`)
    .join('\n\n---\n\n');

  const raw = await provider.complete({
    system: PLANNER_SYSTEM_PROMPT,
    prompt: `Analyze this web application and identify user workflows with ISTQB risk scores:\n\n${crawlSummary}`,
    schema: WorkflowMapSchema,
  });

  const result = WorkflowMapSchema.parse(raw);

  if (options.outputPath) {
    const outPath = path.resolve(options.outputPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`  Saved to ${outPath}`);
  }

  return result;
}
