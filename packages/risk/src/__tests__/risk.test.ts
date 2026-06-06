import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { RunHistory } from '../history';
import { scoreTests, filterByMinPriority } from '../scorer';
import { changedFilesToSegments } from '../git-diff';

describe('RunHistory', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qaforge-risk-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('starts empty', () => {
    const h = new RunHistory(tmpDir);
    expect(h.getAll()).toHaveLength(0);
  });

  it('appends and persists records', () => {
    const h = new RunHistory(tmpDir);
    h.append([{ testFile: 'tests/auth/login.spec.ts', passed: false, duration: 200, timestamp: new Date().toISOString() }]);
    const h2 = new RunHistory(tmpDir);
    expect(h2.getAll()).toHaveLength(1);
  });

  it('calculates flakiness score correctly', () => {
    const h = new RunHistory(tmpDir);
    h.append([
      { testFile: 'a.spec.ts', passed: false, duration: 100, timestamp: '' },
      { testFile: 'a.spec.ts', passed: false, duration: 100, timestamp: '' },
      { testFile: 'a.spec.ts', passed: true, duration: 100, timestamp: '' },
      { testFile: 'a.spec.ts', passed: true, duration: 100, timestamp: '' },
    ]);
    expect(h.flakinessScore('a.spec.ts')).toBeCloseTo(0.5);
  });

  it('returns 0 flakiness for unknown file', () => {
    const h = new RunHistory(tmpDir);
    expect(h.flakinessScore('unknown.spec.ts')).toBe(0);
  });
});

describe('scoreTests', () => {
  it('marks auth tests as business-critical', () => {
    const h = new RunHistory();
    const results = scoreTests(['tests/auth/login.spec.ts'], { history: h });
    expect(results[0]?.reasons).toContain('business-critical path');
  });

  it('flags changed-file impact', () => {
    const h = new RunHistory();
    const results = scoreTests(['tests/auth/login.spec.ts'], {
      changedFiles: ['src/auth/service.ts'],
      history: h,
    });
    expect(results[0]?.reasons.some((r) => r.includes('changed'))).toBe(true);
  });

  it('filterByMinPriority keeps only high+critical', () => {
    const h = new RunHistory();
    const priorities = scoreTests(
      ['tests/auth/login.spec.ts', 'tests/misc/help.spec.ts'],
      { history: h },
    );
    const filtered = filterByMinPriority(priorities, 'high');
    expect(filtered.every((p) => p.level === 'high' || p.level === 'critical')).toBe(true);
  });
});

describe('changedFilesToSegments', () => {
  it('extracts path segments', () => {
    const segs = changedFilesToSegments(['src/auth/login.ts', 'packages/core/index.ts']);
    expect(segs).toContain('auth');
    expect(segs).toContain('core');
  });
});
