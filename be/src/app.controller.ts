import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseBoolPipe,
  Query,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { ApiQuery } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('logs')
  @ApiQuery({
    name: 'error-only',
    required: false,
  })
  async getLogs(
    @Res() res: Response,
    @Query('error-only', new DefaultValuePipe(false), ParseBoolPipe)
    errorOnly?: boolean,
  ) {
    const logs = await readFile(
      join(
        __dirname,
        '../logs/',
        errorOnly ? 'stream-error.log' : 'stream-combined.log',
      ),
      'utf-8',
    );
    res.header('Content-Type', 'text/plain');
    res.send(logs);
  }
}
