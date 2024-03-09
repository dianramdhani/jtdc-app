import Checkout from './checkout';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronTime, CronJob } from 'cron';
import { InjectRepository } from '@nestjs/typeorm';
import { env } from 'process';
import { Repository } from 'typeorm';
import { Account } from 'src/accounts/entities/account.entity';
import { formatDate } from 'src/util/helpers';
import { subMinutes, set } from 'date-fns';
import type { Protocol, PuppeteerLaunchOptions } from 'puppeteer';

@Injectable()
export class BrowserManagerService {
  private readonly logger = new Logger(BrowserManagerService.name);
  private readonly puppeteerLaunchOptions: PuppeteerLaunchOptions = {
    headless: true,
    executablePath: env.CHROME_PATH,
  };

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async cookiesGrabber(username: string) {
    const { connect } = await import('puppeteer-real-browser');
    const { page, browser } = await connect(this.puppeteerLaunchOptions);
    let cookies: Protocol.Network.CookieParam[] = [];

    try {
      await page.goto(env.URL_LOGIN);
      await page.type('input[name="username"]', username);
      await page.type('input[name="password"]', env.PASSWORD);
      await page.click('#remember-me');
      await page.click('form button');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      cookies = await page.cookies();
    } catch (error) {
      this.logger.error('Gagal grab cookies', { cause: error });
    } finally {
      await browser.close();
    }

    return cookies;
  }

  async checkout({
    username,
    rawCookies,
    time,
    usePoint,
  }: {
    username: string;
    rawCookies: string;
    time?: string;
    usePoint?: boolean;
  }) {
    const cronPostfix = `-${username}-${new Date().getTime()}`;
    const checkoutInstance = new Checkout({
      logger: this.logger,
      puppeteerLaunchOptions: this.puppeteerLaunchOptions,
      schedulerRegistry: this.schedulerRegistry,
      rawCookies,
      username,
      usePoint,
      cronPostfix,
    });

    if (!time) {
      await checkoutInstance.prepare();
      await checkoutInstance.process();
      return;
    }

    const [hour, minute] = time.split(':');
    const timePrepare = subMinutes(
      set(new Date(), {
        hours: +hour,
        minutes: +minute,
      }),
      5,
    );
    const prepareJob = new CronJob(
      `${timePrepare.getMinutes()} ${timePrepare.getHours()} * * *`,
      () => checkoutInstance.prepare(),
      undefined,
      undefined,
      'Asia/Jakarta',
    );
    const processJob = new CronJob(
      `${minute} ${hour} * * *`,
      () => checkoutInstance.process(),
      undefined,
      undefined,
      'Asia/Jakarta',
    );
    this.schedulerRegistry.addCronJob(`prepareCO${cronPostfix}`, prepareJob);
    this.schedulerRegistry.addCronJob(`processCO${cronPostfix}`, processJob);
    prepareJob.start();
    processJob.start();
    this.logger.log(
      `${username} prepare ${timePrepare.getHours()}:${timePrepare.getMinutes()}, process ${time}`,
    );
  }

  setAutoLogin(time?: string) {
    if (!time) return this.autoLogin();
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
      this.logger.error('Setidaknya isi username atau cookies');
      return;
    } else if (username) {
      cookies = await this.accountRepository
        .findOneBy({ username })
        .then(({ cookies }) => JSON.parse(cookies));
    }

    const { connect } = await import('puppeteer-real-browser');
    const { page, browser } = await connect(this.puppeteerLaunchOptions);
    let point: number = 0;

    try {
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

  @Cron('0 0 0 * * *', {
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
      this.logger.log(`${account.username} login successful`);
    }
  }
}
