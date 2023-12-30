import { Global, Module } from '@nestjs/common';
import { BrowserManagerService } from './browser-manager.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/accounts/entities/account.entity';
import { BrowserManagerController } from './browser-manager.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [BrowserManagerService],
  exports: [BrowserManagerService],
  controllers: [BrowserManagerController],
})
export class BrowserManagerModule {}
