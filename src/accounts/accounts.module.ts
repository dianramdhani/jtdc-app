import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { Account } from './entities/account.entity';
import { Checkout } from './entities/checkout.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Checkout])],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}
