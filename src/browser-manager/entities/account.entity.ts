import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity()
export class Account {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  username: string;

  @Column()
  cookies?: string;

  @Column()
  lastCookiesUpdate?: string;

  @Column()
  point?: number;
}
