import { PartialType } from '@nestjs/swagger';
import { CreateBrowserManagerDto } from './create-browser-manager.dto';

export class UpdateBrowserManagerDto extends PartialType(CreateBrowserManagerDto) {}
