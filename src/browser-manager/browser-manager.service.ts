import puppeteer, {
  Browser,
  Page,
  Protocol,
  PuppeteerLaunchOptions,
} from 'puppeteer';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronTime, CronJob } from '@nestjs/schedule/node_modules/cron/dist';
import { InjectRepository } from '@nestjs/typeorm';
import { env } from 'process';
import { Repository } from 'typeorm';
import { Account } from 'src/accounts/entities/account.entity';
import { formatDate } from 'src/util/helpers';
import { subMinutes, set } from 'date-fns';

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

  async checkout({
    username,
    rawCookies,
    time,
  }: {
    username: string;
    rawCookies: string;
    time?: string;
  }) {
    let headers: Record<string, string> = {};
    let addressID: number = -1;
    let browser: Browser;
    let page: Page;

    const prepare = async () => {
      browser = await puppeteer.launch(this.puppeteerLaunchOptions);
      page = await browser.newPage();
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
          if (text.includes('~addressID'))
            addressID = +text.split(' ')[1] ?? -1;
          this.logger.log(`${username} console: ${text}`);
        });

      try {
        const cookies = JSON.parse(
          rawCookies,
        ) as Protocol.Network.CookieParam[];
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
        this.logger.log(`${username} prepare checkout successful`);

        try {
          this.schedulerRegistry.getCronJob('prepareCO').stop();
        } catch (error) {}
      } catch (error) {
        this.logger.error(`${username} gagal prepare checkout`, {
          cause: error,
        });
        throw error;
      }
    };

    // TODO: kalau keranjang kosong belum di bikin skenarionya
    // belum ada simpan ke db untuk setiap CO
    const process = async () => {
      const startTime = Date.now();
      await page.evaluate(
        async (urlQuery, headers, addressID, isProd, username) => {
          const process: () => Promise<string[]> = async () => {
            const responses: string[] = [];

            try {
              responses.push(
                ...(await Promise.all([
                  await fetch(urlQuery, {
                    method: 'POST',
                    body: JSON.stringify([
                      {
                        operationName: 'processCheckout',
                        variables: {},
                        query:
                          'query processCheckout {\n  processCheckout {\n    meta {\n      message\n      error\n      code\n    }\n    result\n  }\n}\n',
                      },
                    ]),
                    headers,
                  }).then(async (response) => {
                    const jsonResponse: any = await response.json();
                    console.log(
                      `~processCheckout ${JSON.stringify(jsonResponse)}`,
                    );
                    return jsonResponse[0].data.processCheckout.meta
                      .code as string;
                  }),
                  await fetch(urlQuery, {
                    method: 'POST',
                    body: JSON.stringify([
                      {
                        operationName: 'addPreBook',
                        variables: {
                          params: {
                            isRewardPoint: false,
                            addressID,
                            shippingID: 4,
                            shippingName: 'J&T',
                            shippingDuration: 'Estimasi pengiriman 2-3 Hari',
                          },
                        },
                        query:
                          'mutation addPreBook($params: PreBookRequest!) {\n  addPreBook(params: $params) {\n    meta {\n      message\n      error\n      code\n    }\n    result {\n      status\n      orderID\n      analytic {\n        affiliation\n        coupon\n        currency\n        transaction_id\n        shipping\n        insurance\n        value\n        partial_reward\n        coupon_discount\n        shipping_discount\n        location\n        quantity\n        items {\n          item_id\n          item_name\n          affiliation\n          coupon\n          currency\n          discount\n          index\n          item_brand\n          item_category\n          item_category2\n          item_category3\n          item_category4\n          item_category5\n          item_list_id\n          item_list_name\n          item_variant\n          price\n          quantity\n        }\n        content_id\n        content_type\n        contents {\n          id\n          quantity\n        }\n        description\n        category_id\n        category_name\n        brand_id\n        brand_name\n        sub_brand_id\n        sub_brand_name\n        order_id\n        order_date\n        total_trx\n        shipping_fee\n        insurance_fee\n        tax\n        discount\n        partial_mw_reward\n        shipping_method\n        payment_method\n        is_dropship\n        voucher_code\n        products\n      }\n    }\n  }\n}\n',
                      },
                    ]),
                    headers,
                  }).then(async (response) => {
                    const jsonResponse: any = await response.json();
                    console.log(`~addPreBook ${JSON.stringify(jsonResponse)}`);
                    return jsonResponse[0].data.addPreBook.meta.code as string;
                  }),
                ])),
              );
              isProd &&
                responses.push(
                  await fetch(urlQuery, {
                    method: 'POST',
                    body: JSON.stringify([
                      {
                        operationName: 'addOrder',
                        variables: {
                          params: {
                            paymentID: 57,
                            paymentCode: 'VABCA',
                            paymentName: 'BCA Virtual Account',
                            paymentParentCode: 'VirtualAccount',
                          },
                        },
                        query:
                          'mutation addOrder($params: AddOrderRequest!) {\n  addOrder(params: $params) {\n    meta {\n      error\n      code\n      message\n    }\n    result {\n      payment {\n        status\n        orderId\n        redirectUrl\n      }\n      analytic {\n        affiliation\n        coupon\n        currency\n        transaction_id\n        transaction_code\n        shipping\n        insurance\n        value\n        partial_reward\n        coupon_discount\n        shipping_discount\n        location\n        quantity\n        items {\n          item_id\n          item_name\n          affiliation\n          currency\n          discount\n          index\n          item_brand\n          item_category\n          item_category2\n          item_category3\n          item_category4\n          item_category5\n          item_list_id\n          item_list_name\n          item_variant\n          price\n          quantity\n        }\n        content_id\n        content_type\n        contents {\n          id\n          quantity\n        }\n        description\n        category_id\n        category_name\n        brand_id\n        brand_name\n        sub_brand_id\n        sub_brand_name\n        order_id\n        order_date\n        total_trx\n        shipping_fee\n        insurance_fee\n        tax\n        discount\n        partial_mw_reward\n        shipping_method\n        payment_method\n        is_dropship\n        voucher_code\n        products\n        total_price\n        gender\n        db\n        user_id\n        fb_login_id\n        ip_override\n        user_data {\n          email_address\n          phone_number\n          client_ip_address\n          address {\n            first_name\n            last_name\n            city\n            region\n            postal_code\n            country\n          }\n        }\n      }\n    }\n  }\n}\n',
                      },
                    ]),
                    headers,
                  }).then(async (response) => {
                    const jsonResponse: any = await response.json();
                    console.log(
                      `~addOrder-${username} ${JSON.stringify(jsonResponse)}`,
                    );
                    return jsonResponse[0].data.addOrder.meta.code as string;
                  }),
                );
            } catch (error) {
              console.log(`~error-${username} masih ada yang gagal di proses`);
              responses.push('error');
            }

            return responses;
          };

          let allStatus: string[] = [];
          while (true) {
            allStatus = await process();
            if (!allStatus.some((status) => status !== 'success')) break;
          }
          console.log(`~dataCO-${username} ${JSON.stringify(allStatus)}`);
        },
        env.URL_QUERY,
        headers,
        addressID,
        env.NODE_ENV === 'prod',
        username,
      );
      this.logger.log(`${username} lama CO ${Date.now() - startTime}ms`);
      await browser.close();

      try {
        this.schedulerRegistry.getCronJob('processCO').stop();
      } catch (error) {}
    };

    if (time) {
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
        prepare,
        undefined,
        undefined,
        'Asia/Jakarta',
      );
      const processJob = new CronJob(
        `${minute} ${hour} * * *`,
        process,
        undefined,
        undefined,
        'Asia/Jakarta',
      );
      this.schedulerRegistry.addCronJob('prepareCO', prepareJob);
      this.schedulerRegistry.addCronJob('processCO', processJob);
      prepareJob.start();
      processJob.start();
      this.logger.log(
        `${username} prepare ${timePrepare.getMinutes()}:${timePrepare.getHours()}, process ${time}`,
      );
    } else {
      await prepare();
      await process();
    }
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
      this.logger.log(`${account.username} login successful`);
    }
  }
}
