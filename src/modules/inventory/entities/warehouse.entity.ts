import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Bodega. `isQuality = true` corresponde a la bodega de calidad. */
@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: false })
  isQuality: boolean;

  @Column({ default: true })
  active: boolean;
}
