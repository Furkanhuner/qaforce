import { Command } from 'commander';
import * as path from 'path';
import { loadConfig } from '@qaforge/core';
import { createProvider } from '@qaforge/providers';
import { runPlanner } from '@qaforge/planner';

export const exploreCommand = new Command('explore')
  .description('Crawl the target app and generate a risk-annotated workflow map (Analysis phase)')
  .option('--url <url>', 'Target URL to crawl (overrides config baseUrl)')
  .option('--depth <n>', 'Maximum crawl depth', '2')
  .option('--output <path>', 'Output path for workflows.json', '.qaforge/workflows.json')
  .option('--config <path>', 'Path to qa.config.ts')
  .action(async (opts: { url?: string; depth: string; output: string; config?: string }) => {
    const config = await loadConfig(opts.config);
    const provider = createProvider(config);
    const baseUrl = opts.url ?? config.targets.web?.baseUrl ?? '';

    if (!baseUrl) {
      console.error('Error: provide --url or set targets.web.baseUrl in qa.config.ts');
      process.exit(1);
    }

    const allowlist = config.targets.web?.allowlist ?? [];
    console.log(`Crawling ${baseUrl} (depth: ${opts.depth})…`);

    const result = await runPlanner({
      baseUrl,
      allowlist,
      maxDepth: parseInt(opts.depth, 10),
      provider,
      outputPath: path.resolve(opts.output),
    });

    console.log(`\nFound ${result.workflows.length} workflow(s):`);
    for (const wf of result.workflows) {
      const badge = wf.risk.toUpperCase().padEnd(8);
      console.log(`  [${badge}] ${wf.name}`);
    }
    console.log(`\nSaved to ${opts.output}`);
  });
