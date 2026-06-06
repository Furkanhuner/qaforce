import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

export interface BaselineOptions {
  url: string;
  name: string;
  baselineDir?: string;
  headless?: boolean;
}

export async function captureBaseline(options: BaselineOptions): Promise<Buffer> {
  const { url, name, headless = true } = options;
  const dir = resolveBaselineDir(options.baselineDir);

  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const buf = await page.screenshot({ fullPage: true });
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${name}.png`), buf);
    return buf;
  } finally {
    await browser.close();
  }
}

export async function captureCurrentScreenshot(options: BaselineOptions): Promise<Buffer> {
  const { url, headless = true } = options;
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    return await page.screenshot({ fullPage: true });
  } finally {
    await browser.close();
  }
}

export function getBaselineBuffer(name: string, baselineDir?: string): Buffer | null {
  const filePath = path.join(resolveBaselineDir(baselineDir), `${name}.png`);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
}

function resolveBaselineDir(dir?: string): string {
  return path.resolve(dir ?? '.qaforge/visual/baseline');
}
