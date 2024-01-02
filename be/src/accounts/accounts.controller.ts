import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CheckoutDto } from './dto/checkout.dto';
import { ApiBody, ApiQuery } from '@nestjs/swagger';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
        },
      },
      required: ['username'],
    },
  })
  create(@Body() { username }: { username: string }) {
    return this.accountsService.create(username);
  }

  @Post('multiple')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        usernames: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['usernames'],
    },
    required: false,
  })
  createMultiple(@Body() { usernames }: { usernames?: string[] }) {
    return this.accountsService.createMultiple(usernames);
  }

  @Get()
  @ApiQuery({
    name: 'username-only',
    required: false,
  })
  async findAll(
    @Query('username-only', new DefaultValuePipe(false), ParseBoolPipe)
    usernameOnly?: boolean,
  ) {
    return usernameOnly
      ? (await this.accountsService.findAll()).map(({ username }) => username)
      : this.accountsService.findAll();
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
    this.accountsService.checkout(checkoutDto);
    return 'checkout in process';
  }
}