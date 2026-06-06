import { execSync } from 'child_process';
import { Command } from 'commander';

export const reportCommand = new Command('report')
  .description('Open the Playwright HTML test report')
  .action(() => {
    try {
      execSync('npx playwright show-report', { stdio: 'inherit' });
    } catch {
      process.exit(1);
    }
  });
