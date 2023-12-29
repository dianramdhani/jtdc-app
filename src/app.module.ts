import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BrowserManagerModule } from './browser-manager/browser-manager.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BrowserManagerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
