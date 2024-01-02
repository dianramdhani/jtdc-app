import { transports, format } from 'winston';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { formatDate } from './util/helpers';
import { createWriteStream } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      format: format.combine(
        format.timestamp(),
        format.printf(
          ({ level, message, timestamp, context }) =>
            `${formatDate(
              new Date(timestamp),
            )} [${context}] ${level}: ${message}`,
        ),
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' }),
        new transports.Stream({
          stream: createWriteStream('logs/stream-error.log'),
          level: 'error',
        }),
        new transports.Stream({
          stream: createWriteStream('logs/stream-combined.log'),
        }),
      ],
    }),
  });
  app.enableCors({ origin: '*' });
  const config = new DocumentBuilder().build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
  await app.listen(3000);
}
bootstrap();
