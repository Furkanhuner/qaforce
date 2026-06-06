import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { Command } from 'commander';

const QA_CONFIG_TEMPLATE = `import { defineConfig } from '@qaforge/core';

export default defineConfig({
  project: {
    name: 'my-project',
    owner: 'my-team',
  },

  targets: {
    web: {
      baseUrl: process.env['WEB_BASE_URL'] ?? 'http://localhost:3000',
      browsers: ['chromium'],
    },
  },

  ai: {
    provider: 'anthropic',
    model: process.env['AI_MODEL'] ?? 'claude-3-5-sonnet-20241022',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },

  locators: {
    strategy: ['role', 'label', 'testId', 'text'],
    selfHeal: 'suggest',
  },

  istqb: {
    traceability: true,
    techniques: ['BVA', 'EP'],
  },
});
`;

const PLAYWRIGHT_CONFIG_TEMPLATE = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env['WEB_BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
`;

export const initCommand = new Command('init')
  .description('Scaffold qa.config.ts + playwright.config.ts + tests/ directory')
  .option('--dir <path>', 'Target directory', '.')
  .action((opts: { dir: string }) => {
    const targetDir = resolve(opts.dir);

    mkdirSync(join(targetDir, 'tests', 'auth'), { recursive: true });
    console.log('  create tests/auth/');

    const files: Array<[string, string]> = [
      ['qa.config.ts', QA_CONFIG_TEMPLATE],
      ['playwright.config.ts', PLAYWRIGHT_CONFIG_TEMPLATE],
    ];

    for (const [filename, content] of files) {
      const dest = join(targetDir, filename);
      if (existsSync(dest)) {
        console.log(`  skip   ${filename} (already exists)`);
      } else {
        writeFileSync(dest, content, 'utf-8');
        console.log(`  create ${filename}`);
      }
    }

    console.log('\n✓  qaforge project initialized.');
    console.log('   Next steps:');
    console.log('   1. Edit qa.config.ts — set your baseUrl');
    console.log('   2. export ANTHROPIC_API_KEY=sk-ant-...');
    console.log('   3. qaforge generate "describe your test scenario"');
    console.log('   4. qaforge run');
  });
