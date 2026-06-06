import type { Browser, BrowserContext, Page } from '@playwright/test';
import { chromium, firefox, webkit } from '@playwright/test';
import type { QAConfig } from './config';

export class Session {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private _page: Page | null = null;

  constructor(private readonly config: QAConfig) {}

  async launch(): Promise<Page> {
    const target = this.config.targets.web;
    const browserType = target?.browsers?.[0] ?? 'chromium';

    const launcher =
      browserType === 'firefox' ? firefox : browserType === 'webkit' ? webkit : chromium;

    this.browser = await launcher.launch();
    this.context = await this.browser.newContext({ baseURL: target?.baseUrl });
    this._page = await this.context.newPage();
    return this._page;
  }

  get page(): Page {
    if (!this._page) throw new Error('Session not started. Call launch() first.');
    return this._page;
  }

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.browser = null;
    this.context = null;
    this._page = null;
  }
}
