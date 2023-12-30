import { Injectable, Logger } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { formatDate } from 'src/util/helpers';
import { BrowserManagerService } from 'src/browser-manager/browser-manager.service';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
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
    return `This action returns all accounts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} account`;
  }

  update(id: number, updateAccountDto: UpdateAccountDto) {
    return `This action updates a #${id} account`;
  }

  remove(id: number) {
    return `This action removes a #${id} account`;
  }
}
