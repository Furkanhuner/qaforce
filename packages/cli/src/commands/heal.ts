import { Command } from 'commander';
import { loadConfig } from '@qaforge/core';
import { healLocator } from '@qaforge/healer';
import { createProvider } from '@qaforge/providers';

export const healCommand = new Command('heal')
  .description('Self-heal a broken Playwright locator using AI + accessibility snapshot')
  .option('--url <url>', 'Page URL where the locator broke')
  .option('--locator <locator>', 'The broken locator expression to fix')
  .option(
    '--mode <mode>',
    'suggest — print fix only | auto — rewrite test file (Phase 2)',
    'suggest'
  )
  .option('--config <path>', 'Path to qa.config.ts')
  .action(
    async (opts: { url?: string; locator?: string; mode: string; config?: string }) => {
      if (!opts.url || !opts.locator) {
        console.error('Usage: qaforge heal --url <url> --locator "<locator>"');
        process.exit(1);
      }

      const config = loadConfig(opts.config);
      const provider = createProvider(config);

      const result = await healLocator({
        url: opts.url,
        brokenLocator: opts.locator,
        provider,
      });

      console.log('\n🩹  Heal suggestions:');
      console.log(`   Summary: ${result.summary}\n`);

      result.all.forEach((c, i) => {
        const marker = i === 0 ? '★' : ' ';
        const pct = Math.round(c.confidence * 100);
        console.log(`   ${marker} [${pct}%] ${c.locator}`);
        console.log(`     ↳ ${c.rationale}`);
      });

      if (opts.mode === 'auto') {
        console.log('\n⚠  --mode auto (automatic test file rewrite) is coming in Phase 2.');
        console.log('   Apply the suggested locator manually for now.');
      }
    }
  );
