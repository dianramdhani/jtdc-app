import { Injectable, Logger } from '@nestjs/common';
import { env } from 'process';
import puppeteer, { Protocol } from 'puppeteer';

@Injectable()
export class BrowserManagerService {
  private readonly logger = new Logger(BrowserManagerService.name);

  async cookiesGrabber(username: string) {
    const browser = await puppeteer.launch({
      headless: env.BROWSER_MODE === 'headless' ? 'new' : false,
      defaultViewport: null,
    });
    let cookies: Protocol.Network.CookieParam[] = [];

    try {
      const page = await browser.newPage();
      await page.goto(env.URL_LOGIN);
      await page.type('input[name="username"]', username);
      await page.type('input[name="password"]', env.PASSWORD);
      await page.click('#remember-me');
      await page.click('form button');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      cookies = await page.cookies();
    } catch (error) {
      this.logger.error('Gagal grab cookies', { cause: error });
      throw new Error(error);
    } finally {
      await browser.close();
    }

    return cookies;
  }
}
