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
import { ApiBody, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { Account } from './entities/account.entity';

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
  @ApiOkResponse({ type: Account })
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
  @ApiOkResponse({
    type: Account,
    isArray: true,
  })
  createMultiple(@Body() { usernames }: { usernames?: string[] }) {
    return this.accountsService.createMultiple(usernames);
  }

  @Get()
  @ApiQuery({
    name: 'username-only',
    required: false,
  })
  @ApiOkResponse({
    type: Account,
    isArray: true,
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
  @ApiOkResponse({ type: Account })
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
