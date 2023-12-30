import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { formatDate } from 'src/util/helpers';
import { BrowserManagerService } from 'src/browser-manager/browser-manager.service';
import { CreateAccountDto } from './dto/create-account.dto';
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

  async create({ username }: CreateAccountDto) {
    const cookies = await this.browserManagerService.cookiesGrabber(username);
    const account = await this.accountRepository.findOneBy({ username });
    return this.accountRepository.save({
      ...account,
      username,
      cookies: JSON.stringify(cookies),
      lastCookiesUpdate: formatDate(new Date()),
    });
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

  async checkout({ usernames, time }: CheckoutDto) {
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
        }),
      ),
    );
    return this.checkoutRepository.save({
      accounts,
      time,
    });
  }
}
