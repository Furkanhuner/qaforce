import { Command } from 'commander';
import { loadConfig } from '@qaforge/core';
import { generateFromFlow, generateTest } from '@qaforge/generator';
import { createProvider } from '@qaforge/providers';

export const generateCommand = new Command('generate')
  .description('Generate a Playwright test from a natural language prompt')
  .argument('[prompt]', 'Natural language description of the test scenario')
  .option('--from-flow <path>', 'Generate from a recorded flow JSON file')
  .option('--config <path>', 'Path to qa.config.ts')
  .option('--out <path>', 'Output directory for generated tests', 'tests')
  .action(async (prompt: string | undefined, opts: { fromFlow?: string; config?: string; out: string }) => {
    if (!prompt && !opts.fromFlow) {
      console.error('Usage: qaforge generate "<prompt>"  OR  qaforge generate --from-flow <file.json>');
      process.exit(1);
    }

    const config = loadConfig(opts.config);
    const provider = createProvider(config);

    if (opts.fromFlow) {
      await generateFromFlow({
        flowPath: opts.fromFlow,
        outputDir: opts.out,
        config,
        provider,
      });
    } else {
      await generateTest({
        prompt: prompt!,
        outputDir: opts.out,
        config,
        provider,
      });
    }
  });
