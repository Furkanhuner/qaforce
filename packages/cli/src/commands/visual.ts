import { Command } from 'commander';
import { loadConfig } from '@qaforge/core';
import { createProvider } from '@qaforge/providers';
import { checkVisual } from '@qaforge/visual';

export const visualCommand = new Command('visual')
  .description('Run visual regression baseline capture or diff (Execution phase)')
  .requiredOption('--url <url>', 'Page URL to screenshot')
  .requiredOption('--name <name>', 'Identifier for this visual checkpoint')
  .option('--update', 'Capture/update baseline instead of comparing')
  .option('--threshold <pct>', 'Pixel diff % to trigger AI classification', '0.2')
  .option('--config <path>', 'Path to qa.config.ts')
  .action(
    async (opts: { url: string; name: string; update?: boolean; threshold: string; config?: string }) => {
      const config = await loadConfig(opts.config);
      const provider = createProvider(config);

      const mode = opts.update ? 'Capturing baseline' : 'Checking visual regression';
      console.log(`${mode} for "${opts.name}"…`);

      const result = await checkVisual({
        url: opts.url,
        name: opts.name,
        provider,
        update: opts.update ?? false,
        threshold: parseFloat(opts.threshold),
      });

      if (result.status === 'created') {
        console.log(`Baseline saved: ${opts.name}`);
      } else if (result.status === 'passed') {
        console.log(`Visual check passed (diff: ${result.diffPercentage?.toFixed(2)}%)`);
      } else if (result.status === 'warned') {
        console.log(`Visual diff detected (${result.diffPercentage?.toFixed(2)}%)`);
        console.log(`  ${result.classification?.description}`);
        console.log(`  Diff image: ${result.diffImagePath}`);
      } else {
        console.error(`Visual regression! (${result.diffPercentage?.toFixed(2)}%)`);
        console.error(`  ${result.classification?.description}`);
        console.error(`  Diff image: ${result.diffImagePath}`);
        process.exit(1);
      }
    },
  );
