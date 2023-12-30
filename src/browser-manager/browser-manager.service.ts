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

  async checkout({
    username,
    rawCookies,
    time,
  }: {
    username: string;
    rawCookies: string;
    time: string;
  }) {
    let headers: Record<string, string> = {};
    let addressID: number = -1;
    const browser = await puppeteer.launch({
      headless: env.BROWSER_MODE === 'headless' ? 'new' : false,
      defaultViewport: null,
    });
    const page = await browser.newPage();
    page.setRequestInterception(true);
    page
      .on('request', (request) => request.continue())
      .on('response', async (response) => {
        if (response.url().includes('/query')) {
          try {
            await response.json();
            headers = response.request().headers();
          } catch (error) {}
        }
      })
      .on('console', (message) => {
        const text = message.text();
        if (!text.includes('~')) return;
        if (text.includes('~addressID')) addressID = +text.split(' ')[1] ?? -1;
        if (text.includes('~addOrder')) this.logger.log(text);
        this.logger.log(`console: ${text}`);
      });

    try {
      const cookies = JSON.parse(rawCookies) as Protocol.Network.CookieParam[];
      await page.setCookie(...cookies);
      await page.goto(env.URL_CART, { waitUntil: 'networkidle2' });
      await page.evaluate(
        async (urlQuery, headers, username) => {
          try {
            const addressID = await fetch(urlQuery, {
              method: 'POST',
              body: JSON.stringify([
                {
                  operationName: 'getAddressList',
                  variables: {},
                  query:
                    'query getAddressList($size: Int, $page: Int) {\n  getAddressList(size: $size, page: $page) {\n    meta {\n      page\n      size\n      sort\n      sortType\n      keyword\n      totalData\n      totalPage\n      message\n      error\n      code\n    }\n    result {\n      isSelected\n      addressID\n      addressName\n      addressPhone\n      addressLabel\n      addressZipCode\n      addressDetail\n      latitude\n      longitude\n      provinceID\n      provinceName\n      districtName\n      districtID\n      subdistrictName\n      subdistrictID\n    }\n  }\n}\n',
                },
              ]),
              headers,
            }).then(async (response) => {
              const addressList: any = await response.json();
              return addressList[0].data.getAddressList.result[0]
                .addressID as number;
            });

            addressID
              ? console.log(`~addressID-${username} ${addressID}`)
              : console.log('~error gak ada address id');
          } catch (error) {}
        },
        env.URL_QUERY,
        headers,
        username,
      );
    } catch (error) {
      this.logger.error(`${username} gagal prepare checkout`, { cause: error });
      throw error;
    }

    this.logger.log(addressID, headers);
  }
}
