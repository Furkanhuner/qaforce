import { execSync } from 'child_process';
import { Command } from 'commander';

export const runCommand = new Command('run')
  .description('Run Playwright tests and produce an HTML report')
  .option('--config <path>', 'Playwright config path', 'playwright.config.ts')
  .option('--project <name>', 'Run a specific Playwright project')
  .option('--shard <k/n>', 'Shard tests, e.g. 1/4')
  .option('--changed', 'Run only tests related to changed files (Phase 2 — Risk Engine)')
  .option('--risk <level>', 'Minimum risk level to run (Phase 2)')
  .action(
    (opts: {
      config: string;
      project?: string;
      shard?: string;
      changed?: boolean;
      risk?: string;
    }) => {
      if (opts.changed || opts.risk) {
        console.warn('⚠  --changed and --risk require the Risk Engine (Phase 2). Running all tests.');
      }

      const args = ['playwright', 'test', '--config', opts.config];
      if (opts.project) args.push('--project', opts.project);
      if (opts.shard) args.push('--shard', opts.shard);

      try {
        execSync(['npx', ...args].join(' '), { stdio: 'inherit' });
      } catch {
        process.exit(1);
      }
    }
  );
