import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

export interface LocatorEntry {
  original: string;
  healed: string;
  confidence: number;
  url: string;
  timestamp: string;
}

export interface LocatorStoreData {
  entries: LocatorEntry[];
}

export class LocatorStore {
  private readonly storePath: string;
  private data: LocatorStoreData;

  constructor(storeDir?: string) {
    const dir = storeDir ?? join(process.cwd(), '.qaforge');
    this.storePath = join(dir, 'locator-store.json');
    this.data = this.load();
  }

  private load(): LocatorStoreData {
    if (!existsSync(this.storePath)) return { entries: [] };
    try {
      return JSON.parse(readFileSync(this.storePath, 'utf-8')) as LocatorStoreData;
    } catch {
      return { entries: [] };
    }
  }

  save(entry: LocatorEntry): void {
    this.data.entries.unshift(entry);
    mkdirSync(dirname(this.storePath), { recursive: true });
    writeFileSync(this.storePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  findCached(original: string): LocatorEntry | undefined {
    return this.data.entries.find((e) => e.original === original);
  }

  getAll(): LocatorEntry[] {
    return this.data.entries;
  }
}
