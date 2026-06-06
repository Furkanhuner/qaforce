import { z } from 'zod';

// --- Web test schema ---

export const GeneratedTestSchema = z.object({
  specName: z.string().describe('camelCase identifier for the file, no extension'),
  domain: z.string().describe('kebab-case folder, e.g. "auth", "checkout"'),
  description: z.string().describe('one-line description of what is verified'),
  testType: z.enum(['web', 'api']).default('web'),
  istqb: z.object({
    level: z.enum(['component', 'integration', 'system', 'acceptance']),
    type: z.enum(['functional', 'non-functional', 'change-related']),
    technique: z.array(z.enum(['EP', 'BVA', 'decision-table', 'state-transition', 'use-case'])),
    risk: z.enum(['low', 'medium', 'high', 'critical']),
    requirement: z.string().optional(),
  }),
  tests: z.array(
    z.object({
      title: z.string(),
      steps: z.array(
        z.object({
          action: z.enum([
            // Web actions
            'goto',
            'fill',
            'click',
            'check',
            'expect-text',
            'expect-visible',
            'expect-hidden',
            'wait',
            // API actions
            'api-get',
            'api-post',
            'api-put',
            'api-delete',
            'expect-status',
            'expect-json-field',
          ]),
          locator: z
            .object({
              strategy: z.enum(['role', 'label', 'text', 'testId', 'css']),
              value: z.string(),
              options: z.record(z.string(), z.unknown()).optional(),
            })
            .optional(),
          value: z.string().optional().describe(
            'URL for goto/api-*, fill value, expected text/status, or JSON path for expect-json-field'
          ),
          body: z.record(z.string(), z.unknown()).optional().describe('Request body for api-post/put'),
        })
      ),
    })
  ),
});

export type GeneratedTest = z.infer<typeof GeneratedTestSchema>;

// --- Flow-from-recording schema ---

export const FlowStepSchema = z.object({
  action: z.enum(['goto', 'click', 'fill', 'check', 'select', 'hover']),
  selector: z.string().optional().describe('CSS selector or text from recording'),
  url: z.string().optional(),
  value: z.string().optional(),
});

export const RecordedFlowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  steps: z.array(FlowStepSchema),
});

export type RecordedFlow = z.infer<typeof RecordedFlowSchema>;

// --- System prompts ---

export const SYSTEM_PROMPT = `You are an expert QA engineer applying ISTQB test design techniques.
Generate Playwright test specifications from natural language descriptions.

For WEB tests:
- Locator priority: getByRole → getByLabel → getByText → getByTestId → css. NEVER XPath.
- testType: "web"

For API tests:
- Use api-post/api-get/api-put/api-delete actions (Playwright request fixture).
- Use expect-status for HTTP status assertions, expect-json-field for body assertions.
- testType: "api", level: "integration"

Techniques:
- Apply EP: at least one valid + one invalid partition.
- Apply BVA for input fields: boundary values (empty, max, etc.).
- Multiple test cases for happy-path + error scenarios.

Output ONLY valid raw JSON matching the schema. No markdown, no extra text.`;

export const FLOW_SYSTEM_PROMPT = `You are an expert QA engineer.
You receive a recorded user flow (raw CSS selectors from a browser recording) and convert it into a proper Playwright test specification.

Tasks:
1. Convert CSS selectors to role-based locators (getByRole → getByLabel → getByText → getByTestId → css).
2. Add meaningful assertions after key interactions.
3. Add ISTQB metadata appropriate for the flow.
4. Split into multiple test cases if the flow covers multiple scenarios.

Output ONLY valid raw JSON. No markdown, no extra text.`;

export function buildPrompt(userPrompt: string, baseUrl: string): string {
  return `Base URL: ${baseUrl}

User request: ${userPrompt}

Generate the full Playwright test specification. Include happy-path and all error cases. Apply BVA boundary values for input fields. Set testType based on whether this is a UI or API test.`;
}

export function buildFlowPrompt(flow: RecordedFlow, baseUrl: string): string {
  return `Base URL: ${baseUrl}

Recorded flow name: ${flow.name}
Description: ${flow.description ?? 'No description provided'}

Raw recorded steps:
${JSON.stringify(flow.steps, null, 2)}

Convert this recording into a well-structured Playwright test spec with role-based locators and proper assertions.`;
}
