import { Injectable } from '@nestjs/common';
import { CreateBrowserManagerDto } from './dto/create-browser-manager.dto';
import { UpdateBrowserManagerDto } from './dto/update-browser-manager.dto';

@Injectable()
export class BrowserManagerService {
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
}
