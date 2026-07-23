import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { Stock } from './stock.entity';

/** Variante de un producto por talla + color (unidad de control de stock). */
@Entity('product_variants')
@Unique(['product', 'size', 'color'])
export class ProductVariant extends BaseEntity {
  @ManyToOne(() => Product, (p) => p.variants, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'uuid' })
  productId: string;

  @Column()
  size: string;

  @Column()
  color: string;

  @Index({ unique: true })
  @Column({ nullable: true })
  barcode: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  cost: string;

  @OneToMany(() => Stock, (s) => s.variant)
  stock: Stock[];
}
