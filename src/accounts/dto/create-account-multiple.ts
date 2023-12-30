import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountMultipleDto {
  @ApiProperty()
  usernames: string[];
}
