import puppeteer, { Protocol } from 'puppeteer';
import { env } from 'process';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronTime } from '@nestjs/schedule/node_modules/cron/dist/time';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { formatDate } from 'src/util/helpers';
import { CreateBrowserManagerDto } from './dto/create-browser-manager.dto';
import { UpdateBrowserManagerDto } from './dto/update-browser-manager.dto';
import { Account } from './entities/account.entity';

@Injectable()
export class BrowserManagerService {
  private readonly logger = new Logger(BrowserManagerService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  create(createBrowserManagerDto: CreateBrowserManagerDto) {
    return 'This action adds a new browserManager';
  }

  findAll() {
    return `This action returns all browserManager`;
  }

  findOne(id: number) {
    return `This action returns a #${id} browserManager`;
  }

  update(id: number, updateBrowserManagerDto: UpdateBrowserManagerDto) {
    return `This action updates a #${id} browserManager`;
  }

  remove(id: number) {
    return `This action removes a #${id} browserManager`;
  }

  updateAutoLogin(time: string) {
    const [hour, minute] = time.split(':');
    this.schedulerRegistry
      .getCronJob('auto-login')
      .setTime(new CronTime(`${minute} ${hour} * * *`, 'Asia/Jakarta'));
    return 'Update auto login cron job';
  }

  @Cron('* * 0 * * *', {
    name: 'auto-login',
    timeZone: 'Asia/Jakarta',
  })
  async autoLogin() {}

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

    const account = await this.accountRepository.findOneBy({ username });
    return this.accountRepository.save({
      ...account,
      username,
      cookies: JSON.stringify(cookies),
      lastCookiesUpdate: formatDate(new Date()),
    });
  }
}
