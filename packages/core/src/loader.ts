import { resolve } from 'path';
import { QAConfigSchema } from './config';
import type { QAConfig } from './config';

export function loadConfig(configPath?: string): QAConfig {
  const resolvedPath = configPath
    ? resolve(configPath)
    : resolve(process.cwd(), 'qa.config.ts');

  // jiti enables requiring TypeScript files at runtime without a separate compile step
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const jitiFactory = require('jiti');
  const createJiti = (jitiFactory.default ?? jitiFactory) as (
    filename: string,
    opts?: { interopDefault?: boolean }
  ) => (id: string) => unknown;

  const load = createJiti(__filename, { interopDefault: true });
  const mod = load(resolvedPath) as { default?: QAConfig } | QAConfig;
  const raw = (mod as { default?: QAConfig }).default ?? (mod as QAConfig);

  return QAConfigSchema.parse(raw);
}
