import { z } from 'zod';

const IstqbTechniqueSchema = z.enum([
  'EP',
  'BVA',
  'decision-table',
  'state-transition',
  'use-case',
]);

const LocatorStrategySchema = z.enum(['role', 'label', 'testId', 'text', 'css', 'xpath']);

const AiConfigSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'ollama']),
  model: z.string(),
  apiKeyEnv: z.string(),
  fallback: z
    .object({
      provider: z.enum(['anthropic', 'openai', 'ollama']),
      model: z.string().optional(),
    })
    .optional(),
});

const WebTargetSchema = z.object({
  baseUrl: z.string().url(),
  browsers: z.array(z.enum(['chromium', 'firefox', 'webkit'])).default(['chromium']),
  devices: z.array(z.string()).optional(),
  allowlist: z.array(z.string()).optional(),
});

const ApiTargetSchema = z.object({
  baseUrl: z.string().url(),
  auth: z
    .object({
      type: z.enum(['bearer', 'basic', 'none']),
      tokenEnv: z.string().optional(),
    })
    .optional(),
});

export const QAConfigSchema = z.object({
  project: z.object({
    name: z.string(),
    owner: z.string().optional(),
  }),
  targets: z.object({
    web: WebTargetSchema.optional(),
    api: ApiTargetSchema.optional(),
  }),
  ai: AiConfigSchema,
  locators: z
    .object({
      strategy: z.array(LocatorStrategySchema).default(['role', 'label', 'testId', 'text']),
      selfHeal: z.enum(['auto', 'suggest', 'off']).default('suggest'),
    })
    .optional(),
  visual: z
    .object({
      enabled: z.boolean().default(true),
      threshold: z.number().min(0).max(1).default(0.2),
      aiClassify: z.boolean().default(false),
    })
    .optional(),
  risk: z
    .object({
      strategy: z.enum(['git-diff+history', 'git-diff', 'manual']).default('git-diff+history'),
      minPriority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    })
    .optional(),
  istqb: z
    .object({
      traceability: z.boolean().default(true),
      techniques: z.array(IstqbTechniqueSchema).default(['BVA', 'EP']),
    })
    .optional(),
});

export type QAConfig = z.infer<typeof QAConfigSchema>;

export function defineConfig(config: QAConfig): QAConfig {
  return QAConfigSchema.parse(config);
}
