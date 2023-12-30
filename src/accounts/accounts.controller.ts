import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':username')
  findOne(@Param('username') username: string) {
    return this.accountsService.findOne(username);
  }

  @Delete(':username')
  remove(@Param('username') username: string) {
    return this.accountsService.remove(username);
  }
}
