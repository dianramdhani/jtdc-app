import { Page, Browser, PuppeteerLaunchOptions } from 'puppeteer';

declare module 'puppeteer-real-browser' {
  interface PuppeteerRealBrowser {
    page: Page;
    browser: Browser;
    setTarget: (arg: { status: boolean }) => void;
  }

  function connect(
    options: PuppeteerLaunchOptions,
  ): Promise<PuppeteerRealBrowser>;

  export { connect };
}

export {};
