import * as fs from 'fs';
import * as path from 'path';

export interface RunRecord {
  testFile: string;
  passed: boolean;
  duration: number;
  timestamp: string;
}

export class RunHistory {
  private readonly filePath: string;
  private records: RunRecord[];

  constructor(storeDir?: string) {
    this.filePath = path.resolve(storeDir ?? '.qaforge', 'run-history.json');
    this.records = this.load();
  }

  private load(): RunRecord[] {
    if (!fs.existsSync(this.filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as RunRecord[];
    } catch {
      return [];
    }
  }

  append(records: RunRecord[]): void {
    this.records.push(...records);
    if (this.records.length > 1000) {
      this.records = this.records.slice(-1000);
    }
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.records, null, 2));
  }

  flakinessScore(testFile: string): number {
    const recent = this.records.filter((r) => r.testFile === testFile).slice(-20);
    if (recent.length === 0) return 0;
    return recent.filter((r) => !r.passed).length / recent.length;
  }

  getAll(): RunRecord[] {
    return this.records;
  }
}
