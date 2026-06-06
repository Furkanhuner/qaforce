export interface IstqbMeta {
  level: 'component' | 'integration' | 'system' | 'acceptance';
  type: 'functional' | 'non-functional' | 'change-related';
  technique: Array<'EP' | 'BVA' | 'decision-table' | 'state-transition' | 'use-case'>;
  risk: 'low' | 'medium' | 'high' | 'critical';
  requirement?: string;
}

export interface Locator {
  strategy: 'role' | 'label' | 'text' | 'testId' | 'css' | 'xpath';
  value: string;
  options?: Record<string, unknown>;
}

export interface RiskScore {
  likelihood: number;
  impact: number;
  score: number;
}

export interface Workflow {
  id: string;
  name: string;
  steps: string[];
  risk: RiskScore;
  istqb: IstqbMeta;
}

export interface TestArtifact {
  filePath: string;
  specName: string;
  istqb: IstqbMeta;
  generatedAt: string;
}

export interface RunResult {
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  reportPath?: string;
}
