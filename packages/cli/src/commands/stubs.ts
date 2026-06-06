import { Command } from 'commander';

export const exploreCommand = new Command('explore')
  .description('[Phase 2] Crawl an app and generate a workflow + risk map')
  .option('--url <url>', 'Target URL')
  .action(() => {
    console.log('🚧  explore is coming in Phase 2 (Planner agent + Risk Engine).');
  });

export const visualCommand = new Command('visual')
  .description('[Phase 2] Run visual regression baseline / comparison')
  .option('--update', 'Update baseline screenshots')
  .action(() => {
    console.log('🚧  visual is coming in Phase 2 (Visual agent).');
  });
