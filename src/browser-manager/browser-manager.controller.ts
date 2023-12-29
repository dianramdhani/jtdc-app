import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { BrowserManagerService } from './browser-manager.service';
import { CreateBrowserManagerDto } from './dto/create-browser-manager.dto';
import { UpdateBrowserManagerDto } from './dto/update-browser-manager.dto';
import { Response } from 'express';

@Controller('browser-manager')
export class BrowserManagerController {
  constructor(private readonly browserManagerService: BrowserManagerService) {}

  @Post()
  create(@Body() createBrowserManagerDto: CreateBrowserManagerDto) {
    return this.browserManagerService.create(createBrowserManagerDto);
  }

  @Get()
  findAll() {
    return this.browserManagerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.browserManagerService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBrowserManagerDto: UpdateBrowserManagerDto,
  ) {
    return this.browserManagerService.update(+id, updateBrowserManagerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.browserManagerService.remove(+id);
  }

  @Get('auto-login/now')
  autoLogin(@Res() response: Response) {
    this.browserManagerService.autoLogin();
    response.send('Auto login started');
  }

  @Get('auto-login/:time')
  updateAutoLogin(@Param('time') time: string) {
    return this.browserManagerService.updateAutoLogin(time);
  }

  @Get('cookies-grabber/:username')
  cookiesGrabber(@Param('username') username: string) {
    return this.browserManagerService.cookiesGrabber(username);
  }
}
