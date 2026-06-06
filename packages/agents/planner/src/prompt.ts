import { z } from 'zod';

export const WorkflowStepSchema = z.object({
  action: z.enum(['navigate', 'click', 'fill', 'submit', 'assert']),
  locator: z.string().optional(),
  value: z.string().optional(),
  description: z.string(),
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  steps: z.array(WorkflowStepSchema),
  risk: z.enum(['low', 'medium', 'high', 'critical']),
  istqb: z.object({
    level: z.enum(['component', 'integration', 'system', 'acceptance']),
    type: z.enum(['functional', 'non-functional', 'regression', 'confirmation']),
    techniques: z.array(z.enum(['EP', 'BVA', 'decision-table', 'state-transition', 'use-case'])),
  }),
  requirement: z.string().optional(),
});

export const WorkflowMapSchema = z.object({
  baseUrl: z.string(),
  crawledAt: z.string(),
  workflows: z.array(WorkflowSchema),
  summary: z.string(),
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type PlannerWorkflow = z.infer<typeof WorkflowSchema>;
export type WorkflowMap = z.infer<typeof WorkflowMapSchema>;

export const PLANNER_SYSTEM_PROMPT = `You are a senior QA architect applying ISTQB Foundation methodology.
Analyze accessibility snapshots of web pages and identify distinct user workflows.

For each workflow assign:
- risk level: critical (auth/payment/data-loss), high (core features), medium (secondary flows), low (informational)
- ISTQB test level: component | integration | system | acceptance
- ISTQB test type: functional | non-functional | regression | confirmation
- Design techniques: EP (equivalence partitioning), BVA (boundary value analysis), decision-table, state-transition, use-case

Return ONLY a valid JSON object — no markdown, no prose:
{
  "baseUrl": "<string>",
  "crawledAt": "<ISO8601>",
  "workflows": [
    {
      "id": "wf-001",
      "name": "<human readable name>",
      "url": "<page url>",
      "steps": [
        { "action": "navigate|click|fill|submit|assert", "locator": "<optional>", "value": "<optional>", "description": "<step description>" }
      ],
      "risk": "low|medium|high|critical",
      "istqb": {
        "level": "component|integration|system|acceptance",
        "type": "functional|non-functional|regression|confirmation",
        "techniques": ["EP"]
      },
      "requirement": "<optional REQ-ID>"
    }
  ],
  "summary": "<brief summary of app and key risk areas>"
}`;
