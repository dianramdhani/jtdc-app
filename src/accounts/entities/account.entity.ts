import { IsEmail } from 'class-validator';
import { Column, Entity, ManyToOne, ObjectId, ObjectIdColumn } from 'typeorm';
import { Checkout } from './checkout.entity';

@Entity()
export class Account {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ unique: true })
  @IsEmail()
  username: string;

  @Column()
  cookies?: string;

  @Column()
  lastCookiesUpdate?: string;

  @Column()
  point?: number;

  @ManyToOne(() => Checkout, (checkout) => checkout.accounts)
  checkout?: Checkout;
}
