import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { formatDate } from 'src/util/helpers';
import { BrowserManagerService } from 'src/browser-manager/browser-manager.service';
import { Account } from './entities/account.entity';
import { Checkout } from './entities/checkout.entity';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Checkout)
    private readonly checkoutRepository: Repository<Checkout>,
    private readonly browserManagerService: BrowserManagerService,
  ) {}

  async create(username: string) {
    const cookies = await this.browserManagerService.cookiesGrabber(username);
    const account = await this.accountRepository.findOneBy({ username });
    this.logger.log(`${username} cookies updated`);
    return this.accountRepository.save({
      ...account,
      username,
      cookies: JSON.stringify(cookies),
      lastCookiesUpdate: formatDate(new Date()),
    });
  }

  async createMultiple(usernames?: string[]) {
    if (!usernames) {
      usernames = (await this.accountRepository.find()).map(
        ({ username }) => username,
      );
    }
    const results: Account[] = [];
    for (const username of usernames) {
      results.push(await this.create(username));
    }
    return results;
  }

  findAll() {
    return this.accountRepository.find();
  }

  findOne(username: string) {
    return this.accountRepository.findOneBy({ username });
  }

  remove(username: string) {
    return this.accountRepository.delete({ username });
  }

  async checkout({ usernames, time, usePoint }: CheckoutDto) {
    const accounts = await Promise.all(
      usernames.map((username) =>
        this.accountRepository.findOneBy({ username }),
      ),
    );
    await Promise.all(
      accounts.map((account) =>
        this.browserManagerService.checkout({
          username: account.username,
          rawCookies: account.cookies,
          time,
          usePoint,
        }),
      ),
    );
    return this.checkoutRepository.save({
      accounts,
      time,
    });
  }
}
