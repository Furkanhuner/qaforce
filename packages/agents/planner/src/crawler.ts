import { chromium } from 'playwright';

export interface PageSnapshot {
  url: string;
  title: string;
  a11ySnapshot: string;
  links: string[];
}

export async function crawl(
  baseUrl: string,
  allowlist: string[],
  maxDepth = 2,
  headless = true,
): Promise<PageSnapshot[]> {
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: baseUrl, depth: 0 }];
  const results: PageSnapshot[] = [];

  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();

  try {
    while (queue.length > 0) {
      const item = queue.shift()!;
      if (visited.has(item.url) || item.depth > maxDepth) continue;
      if (!isAllowed(item.url, baseUrl, allowlist)) continue;
      visited.add(item.url);

      try {
        await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const title = await page.title();
        const a11ySnapshot = await page.locator('body').ariaSnapshot();

        const links = await page.evaluate((base: string) => {
          return Array.from(document.querySelectorAll('a[href]'))
            .map((a) => {
              try {
                return new URL((a as HTMLAnchorElement).href, base).toString().split('#')[0] ?? '';
              } catch {
                return '';
              }
            })
            .filter((u) => u.startsWith(base));
        }, baseUrl);

        const uniqueLinks = [...new Set(links)].filter((l) => !visited.has(l));
        results.push({ url: item.url, title, a11ySnapshot, links: uniqueLinks });

        if (item.depth < maxDepth) {
          for (const link of uniqueLinks) {
            queue.push({ url: link, depth: item.depth + 1 });
          }
        }
      } catch {
        // skip pages that fail to load
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}

function isAllowed(url: string, baseUrl: string, allowlist: string[]): boolean {
  if (!url.startsWith(baseUrl)) return false;
  if (allowlist.length === 0) return true;
  return allowlist.some((allowed) => url.includes(allowed));
}
