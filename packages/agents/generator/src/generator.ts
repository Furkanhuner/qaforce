import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { QAConfig } from '@qaforge/core';
import type { LLMProvider } from '@qaforge/providers';
import { DEFAULT_ISTQB, renderIstqbBlock } from './istqb';
import type { IstqbAnnotation } from './istqb';
import {
  FLOW_SYSTEM_PROMPT,
  GeneratedTestSchema,
  RecordedFlowSchema,
  SYSTEM_PROMPT,
  buildFlowPrompt,
  buildPrompt,
} from './prompt';
import type { GeneratedTest, RecordedFlow } from './prompt';

type Step = GeneratedTest['tests'][0]['steps'][0];
type Locator = NonNullable<Step['locator']>;

function renderLocator(loc: Locator): string {
  const opts = loc.options ? `, ${JSON.stringify(loc.options)}` : '';
  switch (loc.strategy) {
    case 'role':
      return `page.getByRole('${loc.value}'${opts})`;
    case 'label':
      return `page.getByLabel(${JSON.stringify(loc.value)}${opts})`;
    case 'text':
      return `page.getByText(${JSON.stringify(loc.value)}${opts})`;
    case 'testId':
      return `page.getByTestId(${JSON.stringify(loc.value)}${opts})`;
    case 'css':
      return `page.locator(${JSON.stringify(loc.value)})`;
  }
}

function renderWebStep(step: Step): string {
  const { action, locator, value } = step;
  const loc = locator ? renderLocator(locator) : '';

  switch (action) {
    case 'goto':
      return `    await page.goto(${JSON.stringify(value ?? '/')});`;
    case 'fill':
      return `    await ${loc}.fill(${JSON.stringify(value ?? '')});`;
    case 'click':
      return `    await ${loc}.click();`;
    case 'check':
      return `    await ${loc}.check();`;
    case 'expect-text':
      return `    await expect(${loc}).toContainText(${JSON.stringify(value ?? '')});`;
    case 'expect-visible':
      return `    await expect(${loc}).toBeVisible();`;
    case 'expect-hidden':
      return `    await expect(${loc}).toBeHidden();`;
    case 'wait':
      return `    await ${loc}.waitFor();`;
    default:
      return `    // unhandled web action: ${action}`;
  }
}

function renderApiStep(step: Step, responseVar: string): string {
  const { action, value, body } = step;
  const bodyStr = body ? `, { data: ${JSON.stringify(body)} }` : '';

  switch (action) {
    case 'api-get':
      return `    const ${responseVar} = await request.get(${JSON.stringify(value ?? '/')});`;
    case 'api-post':
      return `    const ${responseVar} = await request.post(${JSON.stringify(value ?? '/')}${bodyStr});`;
    case 'api-put':
      return `    const ${responseVar} = await request.put(${JSON.stringify(value ?? '/')}${bodyStr});`;
    case 'api-delete':
      return `    const ${responseVar} = await request.delete(${JSON.stringify(value ?? '/')});`;
    case 'expect-status':
      return `    expect(${responseVar}.status()).toBe(${value ?? '200'});`;
    case 'expect-json-field': {
      // value format: "field=expectedValue"
      const [field, expected] = (value ?? '').split('=');
      return `    expect((await ${responseVar}.json()).${field ?? 'field'}).toBe(${JSON.stringify(expected ?? '')});`;
    }
    default:
      return `    // unhandled API action: ${action}`;
  }
}

function renderTestBody(test: GeneratedTest['tests'][0], isApi: boolean): string {
  const fixture = isApi ? '{ request }' : '{ page }';
  let responseVarCounter = 0;
  let lastResponseVar = 'response';

  const steps = test.steps.map((step) => {
    const isApiAction = [
      'api-get', 'api-post', 'api-put', 'api-delete',
      'expect-status', 'expect-json-field',
    ].includes(step.action);

    if (isApi && isApiAction) {
      if (['api-get', 'api-post', 'api-put', 'api-delete'].includes(step.action)) {
        lastResponseVar = `response${responseVarCounter++ > 0 ? responseVarCounter : ''}`;
      }
      return renderApiStep(step, lastResponseVar);
    }
    return renderWebStep(step);
  });

  return `  test(${JSON.stringify(test.title)}, async (${fixture}) => {\n${steps.join('\n')}\n  });`;
}

function renderSpecFile(data: GeneratedTest): string {
  const istqb: IstqbAnnotation = { ...DEFAULT_ISTQB, ...data.istqb };
  const block = renderIstqbBlock(istqb);
  const isApi = data.testType === 'api';

  const testBodies = data.tests.map((t) => renderTestBody(t, isApi)).join('\n\n');

  return `${block}
import { test, expect } from '@playwright/test';

test.describe(${JSON.stringify(data.description)}, () => {
${testBodies}
});
`;
}

function writeSpec(data: GeneratedTest, outputDir?: string): string {
  const testsRoot = outputDir ?? join(process.cwd(), 'tests');
  const domainDir = join(testsRoot, data.domain || 'general');
  mkdirSync(domainDir, { recursive: true });
  const filePath = join(domainDir, `${data.specName}.spec.ts`);
  writeFileSync(filePath, renderSpecFile(data), 'utf-8');
  console.log(`✓  Generated: ${filePath}`);
  return filePath;
}

export interface GenerateOptions {
  prompt: string;
  outputDir?: string;
  config: QAConfig;
  provider: LLMProvider;
}

export async function generateTest(options: GenerateOptions): Promise<string> {
  const { prompt, outputDir, config, provider } = options;
  const baseUrl = config.targets.web?.baseUrl ?? config.targets.api?.baseUrl ?? 'http://localhost:3000';

  console.log('⚙  Calling LLM to generate test...');
  const raw = await provider.complete({
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(prompt, baseUrl),
    schema: GeneratedTestSchema,
  });

  return writeSpec(GeneratedTestSchema.parse(raw), outputDir);
}

export interface GenerateFromFlowOptions {
  flowPath: string;
  outputDir?: string;
  config: QAConfig;
  provider: LLMProvider;
}

export async function generateFromFlow(options: GenerateFromFlowOptions): Promise<string> {
  const { flowPath, outputDir, config, provider } = options;
  const baseUrl = config.targets.web?.baseUrl ?? 'http://localhost:3000';

  const raw = JSON.parse(readFileSync(flowPath, 'utf-8')) as unknown;
  const flow = RecordedFlowSchema.parse(raw) as RecordedFlow;

  console.log(`⚙  Converting flow "${flow.name}" to Playwright test...`);
  const result = await provider.complete({
    system: FLOW_SYSTEM_PROMPT,
    prompt: buildFlowPrompt(flow, baseUrl),
    schema: GeneratedTestSchema,
  });

  return writeSpec(GeneratedTestSchema.parse(result), outputDir);
}
