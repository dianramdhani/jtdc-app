import { IsEmail } from 'class-validator';
import { Column, Entity, ManyToOne, ObjectId, ObjectIdColumn } from 'typeorm';
import { Checkout } from './checkout.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Account {
  @ObjectIdColumn()
  id: ObjectId;

  @ApiProperty()
  @Column({ unique: true })
  @IsEmail()
  username: string;

  @Column()
  cookies?: string;

  @ApiProperty()
  @Column()
  lastCookiesUpdate?: string;

  @ApiProperty()
  @Column()
  point?: number;

  @ApiProperty()
  @Column()
  lastLogin?: string;

  @ManyToOne(() => Checkout, (checkout) => checkout.accounts)
  checkout?: Checkout;
}
