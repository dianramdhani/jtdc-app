import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BrowserManagerService } from './browser-manager.service';
import { ApiBody } from '@nestjs/swagger';

@Controller('browser-manager')
export class BrowserManagerController {
  constructor(private readonly browserManagerService: BrowserManagerService) {}

  @Post('set-auto-login')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        time: {
          type: 'string',
        },
      },
      required: ['time'],
    },
  })
  setAutoLogin(@Body() { time }: { time: string }) {
    this.browserManagerService.setAutoLogin(time);
    return 'Set auto login successfully';
  }

  @Get('point/:username')
  getPoint(@Param('username') username: string) {
    return this.browserManagerService.getPoint({ username });
  }
}
