import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { Command } from 'commander';
import { getChangedFiles, RunHistory, scoreTests, filterByMinPriority, type RiskLevel } from '@qaforge/risk';

function findSpecFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSpecFiles(full));
    } else if (entry.name.endsWith('.spec.ts')) {
      results.push(full);
    }
  }
  return results;
}

export const runCommand = new Command('run')
  .description('Run Playwright tests and produce an HTML report (Execution phase)')
  .option('--config <path>', 'Playwright config path', 'playwright.config.ts')
  .option('--project <name>', 'Run a specific Playwright project')
  .option('--shard <k/n>', 'Shard tests, e.g. 1/4')
  .option('--changed', 'Run only tests related to changed files (Risk Engine)')
  .option('--risk <level>', 'Minimum risk level: low | medium | high | critical')
  .action(
    (opts: { config: string; project?: string; shard?: string; changed?: boolean; risk?: string }) => {
      let extraArgs = '';

      if (opts.changed || opts.risk) {
        const changedFiles = opts.changed ? getChangedFiles() : [];
        const history = new RunHistory();
        const testFiles = findSpecFiles('tests');

        if (testFiles.length > 0 && (opts.changed || opts.risk)) {
          const priorities = scoreTests(testFiles, { changedFiles, history });
          const minLevel = (opts.risk ?? 'low') as RiskLevel;
          const filtered = filterByMinPriority(priorities, minLevel);

          if (filtered.length === 0) {
            console.log(`No tests meet minimum risk level "${minLevel}". Exiting.`);
            return;
          }

          console.log(`Running ${filtered.length} of ${testFiles.length} tests (risk >= ${minLevel}):`);
          for (const p of filtered) {
            console.log(`  [${p.level.toUpperCase()}] ${path.relative(process.cwd(), p.testFile)}`);
          }
          extraArgs = filtered.map((p) => JSON.stringify(p.testFile)).join(' ');
        } else if (changedFiles.length === 0 && opts.changed) {
          console.log('No changed files detected — running all tests.');
        }
      }

      const args = ['npx', 'playwright', 'test', '--config', opts.config];
      if (opts.project) args.push('--project', opts.project);
      if (opts.shard) args.push('--shard', opts.shard);

      const cmd = extraArgs ? `${args.join(' ')} ${extraArgs}` : args.join(' ');

      try {
        execSync(cmd, { stdio: 'inherit' });
      } catch {
        process.exit(1);
      }
    },
  );
