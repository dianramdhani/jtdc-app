import puppeteer, { Protocol, PuppeteerLaunchOptions } from 'puppeteer';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronTime } from '@nestjs/schedule/node_modules/cron/dist';
import { InjectRepository } from '@nestjs/typeorm';
import { env } from 'process';
import { Repository } from 'typeorm';
import { Account } from 'src/accounts/entities/account.entity';
import { formatDate } from 'src/util/helpers';

@Injectable()
export class BrowserManagerService {
  private readonly logger = new Logger(BrowserManagerService.name);
  private readonly puppeteerLaunchOptions: PuppeteerLaunchOptions = {
    headless: env.BROWSER_MODE === 'headless' ? 'new' : false,
    defaultViewport: null,
  };

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

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

  // TODO: belum selesai
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
    const browser = await puppeteer.launch(this.puppeteerLaunchOptions);
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

  setAutoLogin(time: string) {
    const [hour, minute] = time.split(':');
    this.schedulerRegistry
      .getCronJob('autoLogin')
      .setTime(new CronTime(`${minute} ${hour} * * *`, 'Asia/Jakarta'));
  }

  async getPoint({
    username,
    cookies,
  }: {
    username?: string;
    cookies?: Protocol.Network.CookieParam[];
  }) {
    if (!username && !cookies) {
      throw new Error('Setidaknya isi username atau cookies');
    }
    if (username) {
      cookies = await this.accountRepository
        .findOneBy({ username })
        .then(({ cookies }) => JSON.parse(cookies));
    }

    const browser = await puppeteer.launch(this.puppeteerLaunchOptions);
    let point: number = 0;

    try {
      const page = await browser.newPage();
      await page.setCookie(...cookies);
      await page.goto(env.URL_MEMBERSHIP, { waitUntil: 'networkidle2' });
      point = await page.$eval(
        '[data-testid="link-mw-point"] p:nth-child(2)',
        (el) => +el.textContent.replace(/[^\d]/g, ''),
      );
    } catch (error) {
      this.logger.error('Gagal get point', { cause: error });
    } finally {
      await browser.close();
    }

    return point;
  }

  @Cron('* * 0 * * *', {
    name: 'autoLogin',
    timeZone: 'Asia/Jakarta',
  })
  private async autoLogin() {
    const accounts = await this.accountRepository.find();
    for (const account of accounts) {
      const point = await this.getPoint({
        cookies: JSON.parse(account.cookies),
      });
      await this.accountRepository.save({
        ...account,
        point,
        lastLogin: formatDate(new Date()),
      });
    }
  }
}
