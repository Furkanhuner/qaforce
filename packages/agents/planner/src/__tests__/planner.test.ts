import { describe, it, expect } from 'vitest';
import { WorkflowMapSchema, WorkflowSchema } from '../prompt';

describe('WorkflowMapSchema', () => {
  const validWorkflow = {
    id: 'wf-001',
    name: 'User Login',
    url: 'http://localhost:3000',
    steps: [
      { action: 'fill', locator: 'email', value: 'user@example.com', description: 'Enter email' },
      { action: 'fill', locator: 'password', value: 'secret', description: 'Enter password' },
      { action: 'click', locator: 'submit', description: 'Click login' },
    ],
    risk: 'critical',
    istqb: {
      level: 'system',
      type: 'functional',
      techniques: ['EP', 'BVA'],
    },
    requirement: 'REQ-AUTH-001',
  };

  it('validates a correct workflow', () => {
    expect(() => WorkflowSchema.parse(validWorkflow)).not.toThrow();
  });

  it('rejects invalid risk level', () => {
    expect(() => WorkflowSchema.parse({ ...validWorkflow, risk: 'extreme' })).toThrow();
  });

  it('validates a complete WorkflowMap', () => {
    const map = {
      baseUrl: 'http://localhost:3000',
      crawledAt: new Date().toISOString(),
      workflows: [validWorkflow],
      summary: 'A simple login app with auth workflow.',
    };
    const result = WorkflowMapSchema.parse(map);
    expect(result.workflows).toHaveLength(1);
    expect(result.workflows[0]?.risk).toBe('critical');
  });

  it('allows optional requirement field', () => {
    const wf = WorkflowSchema.parse({ ...validWorkflow, requirement: undefined });
    expect(wf.requirement).toBeUndefined();
  });
});
