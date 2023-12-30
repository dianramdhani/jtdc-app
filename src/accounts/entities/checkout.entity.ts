import { Column, Entity, ObjectId, ObjectIdColumn, OneToMany } from 'typeorm';
import { Account } from './account.entity';

@Entity()
export class Checkout {
  @ObjectIdColumn()
  id: ObjectId;

  @OneToMany(() => Account, (account) => account.checkout)
  accounts: Account[];

  @Column()
  time: string;
}
