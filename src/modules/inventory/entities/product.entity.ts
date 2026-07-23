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
import { Brand } from './brand.entity';
import { Material } from './material.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';

/** Producto (referencia de calzado); el stock se controla por variante. */
@Entity('products')
export class Product extends BaseEntity {
  @Index({ unique: true })
  @Column()
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', nullable: true })
  characteristics: Record<string, string> | null;

  @Column({ type: 'text', nullable: true })
  cuidados: string | null;

  @ManyToOne(() => Brand, (b) => b.products, { nullable: true, eager: true })
  @JoinColumn({ name: 'brandId' })
  brand: Brand | null;

  @Column({ type: 'uuid', nullable: true })
  brandId: string | null;

  @ManyToOne(() => Material, (m) => m.products, { nullable: true, eager: true })
  @JoinColumn({ name: 'materialId' })
  material: Material | null;

  @Column({ type: 'uuid', nullable: true })
  materialId: string | null;

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
    orphanedRowAction: 'delete',
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (img) => img.product, { eager: true })
  images: ProductImage[];
}
