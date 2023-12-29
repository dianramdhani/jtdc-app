import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BrowserManagerModule } from './browser-manager/browser-manager.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), BrowserManagerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
