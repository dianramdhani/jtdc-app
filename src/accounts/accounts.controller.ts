import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { CreateAccountMultipleDto } from './dto/create-account-multiple';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Post('multiple')
  createMultiple(@Body() createAccountMultipleDto: CreateAccountMultipleDto) {
    return this.accountsService.createMultiple(createAccountMultipleDto);
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

  @Post('checkout')
  checkout(@Body() checkoutDto: CheckoutDto) {
    return this.accountsService.checkout(checkoutDto);
  }
}
