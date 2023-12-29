import { Module } from '@nestjs/common';
import { BrowserManagerService } from './browser-manager.service';
import { BrowserManagerController } from './browser-manager.controller';

@Module({
  controllers: [BrowserManagerController],
  providers: [BrowserManagerService],
})
export class BrowserManagerModule {}
