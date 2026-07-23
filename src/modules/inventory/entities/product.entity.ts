import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';

/** Producto (referencia de calzado); el stock se controla por variante. */
@Entity('products')
export class Product extends BaseEntity {
  @Index({ unique: true })
  @Column()
  sku: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  material: string;

  @Column({ default: 'par' })
  unit: string;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => Category, (c) => c.products, { nullable: true, eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category | null;

  @Column({ type: 'uuid', nullable: true })
  categoryId: string | null;

  @OneToMany(() => ProductVariant, (v) => v.product, {
    cascade: true,
    eager: true,
  })
  variants: ProductVariant[];
}
