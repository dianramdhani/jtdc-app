import { Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { env } from 'process';
import type {
  Browser,
  Page,
  Protocol,
  PuppeteerLaunchOptions,
} from 'puppeteer';

export default class Checkout {
  private headers: Record<string, string> = {};
  private addressID: number = -1;
  private browser?: Browser;
  private page?: Page;

  constructor(
    private readonly config: {
      puppeteerLaunchOptions: PuppeteerLaunchOptions;
      username: string;
      rawCookies: string;
      logger: Logger;
      schedulerRegistry: SchedulerRegistry;
      usePoint?: boolean;
    },
  ) {}

  async prepare() {
    const { connect } = await import('puppeteer-real-browser');
    ({ browser: this.browser, page: this.page } = await connect(
      this.config.puppeteerLaunchOptions,
    ));
    this.page.setRequestInterception(true);
    this.page
      .on('request', (request) => request.continue())
      .on('response', async (response) => {
        if (response.url().includes('/query')) {
          try {
            await response.json();
            this.headers = response.request().headers();
          } catch (error) {}
        }
      })
      .on('console', (message) => {
        const text = message.text();
        if (!text.includes('~')) return;
        if (text.includes('~addressID'))
          this.addressID = +text.split(' ')[1] ?? -1;
        this.config.logger.log(`${this.config.username} console: ${text}`);
      });

    try {
      const cookies = JSON.parse(
        this.config.rawCookies,
      ) as Protocol.Network.CookieParam[];
      await this.page.setCookie(...cookies);
      await this.page.goto(env.URL_CART, { waitUntil: 'networkidle2' });
      await this.page.evaluate(
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
        this.headers,
        this.config.username,
      );
      this.config.logger.log(
        `${this.config.username} prepare checkout successful`,
      );

      try {
        this.config.schedulerRegistry.getCronJob('prepareCO').stop();
      } catch (error) {}
    } catch (error) {
      this.config.logger.error(
        `${this.config.username} gagal prepare checkout`,
        {
          cause: error,
        },
      );
    }
  }

  //   TODO: belum handle kalau keranjang kosong
  async process() {
    try {
      const startTime = Date.now();
      await this.page?.evaluate(
        async (urlQuery, headers, addressID, isProd, username, usePoint) => {
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
                            isRewardPoint: usePoint,
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
        this.headers,
        this.addressID,
        env.NODE_ENV === 'prod',
        this.config.username,
        this.config.usePoint ?? false,
      );
      this.config.logger.log(
        `${this.config.username} lama CO ${Date.now() - startTime}ms`,
      );
    } catch (error) {
      this.config.logger.error(`${this.config.username} gagal process CO`, {
        cause: error,
      });
    } finally {
      await this.browser?.close();
    }

    try {
      this.config.schedulerRegistry.getCronJob('processCO').stop();
    } catch (error) {}
  }
}
