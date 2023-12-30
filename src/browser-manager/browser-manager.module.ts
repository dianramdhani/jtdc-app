import { Module } from '@nestjs/common';
import { BrowserManagerService } from './browser-manager.service';
import { BrowserManagerController } from './browser-manager.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  controllers: [BrowserManagerController],
  providers: [BrowserManagerService],
})
export class BrowserManagerModule {}
