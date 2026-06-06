import { Command } from 'commander';
import { generateCommand } from './commands/generate';
import { healCommand } from './commands/heal';
import { initCommand } from './commands/init';
import { reportCommand } from './commands/report';
import { runCommand } from './commands/run';
import { exploreCommand, visualCommand } from './commands/stubs';

const program = new Command()
  .name('qaforge')
  .description('AI-powered QA test automation — ISTQB-aligned, provider-independent, self-healing')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(runCommand);
program.addCommand(reportCommand);
program.addCommand(healCommand);
program.addCommand(exploreCommand);
program.addCommand(visualCommand);

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
