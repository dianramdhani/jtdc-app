import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty()
  usernames: string[];

  @ApiProperty()
  time: string;
}
