import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';

/** Marca de producto. */
@Entity('brands')
export class Brand extends BaseEntity {
  @Index({ unique: true })
  @Column()
  name: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Product, (p) => p.brand)
  products: Product[];
}
