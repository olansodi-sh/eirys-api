import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';

/** Material de producto. */
@Entity('materials')
export class Material extends BaseEntity {
  @Index({ unique: true })
  @Column()
  name: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Product, (p) => p.material)
  products: Product[];
}
