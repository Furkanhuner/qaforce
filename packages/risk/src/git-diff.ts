import { execSync } from 'child_process';

export function getChangedFiles(base = 'HEAD~1'): string[] {
  try {
    const out = execSync(`git diff --name-only ${base}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return out.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export function changedFilesToSegments(changedFiles: string[]): string[] {
  return [
    ...new Set(
      changedFiles.flatMap((f) => {
        const parts = f.replace(/\\/g, '/').split('/');
        // e.g. src/auth/login.ts → ['src', 'auth', 'login']
        return parts.slice(0, 3).map((p) => p.replace(/\.\w+$/, ''));
      }),
    ),
  ];
}
