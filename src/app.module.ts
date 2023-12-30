import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { BrowserManagerModule } from './browser-manager/browser-manager.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { env } from 'process';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: env.DB_URL,
      database: 'jtdc_app',
      useNewUrlParser: true,
      autoLoadEntities: true,
    }),
    BrowserManagerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
