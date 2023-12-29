import { Injectable, Logger } from '@nestjs/common';
import { CreateBrowserManagerDto } from './dto/create-browser-manager.dto';
import { UpdateBrowserManagerDto } from './dto/update-browser-manager.dto';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronTime } from '@nestjs/schedule/node_modules/cron/dist/time';

@Injectable()
export class BrowserManagerService {
  private readonly logger = new Logger(BrowserManagerService.name);

  constructor(private schedulerRegistry: SchedulerRegistry) {}

  create(createBrowserManagerDto: CreateBrowserManagerDto) {
    return 'This action adds a new browserManager';
  }

  findAll() {
    return `This action returns all browserManager`;
  }

  findOne(id: number) {
    return `This action returns a #${id} browserManager`;
  }

  update(id: number, updateBrowserManagerDto: UpdateBrowserManagerDto) {
    return `This action updates a #${id} browserManager`;
  }

  remove(id: number) {
    return `This action removes a #${id} browserManager`;
  }

  updateAutoLogin(time: string) {
    const [hour, minute] = time.split(':');
    this.schedulerRegistry
      .getCronJob('auto-login')
      .setTime(new CronTime(`${minute} ${hour} * * *`, 'Asia/Jakarta'));
    return 'Update auto login cron job';
  }

  @Cron('* * 0 * * *', {
    name: 'auto-login',
    timeZone: 'Asia/Jakarta',
  })
  autoLogin() {
    this.logger.debug('Called when the current second is 45');
  }
}
