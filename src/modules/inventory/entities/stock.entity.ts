import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProductVariant } from './product-variant.entity';
import { Warehouse } from './warehouse.entity';

/** Existencias de una variante en una bodega. */
@Entity('stock')
@Unique(['variant', 'warehouse'])
export class Stock extends BaseEntity {
  @ManyToOne(() => ProductVariant, (v) => v.stock, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ type: 'uuid' })
  variantId: string;

  @ManyToOne(() => Warehouse, { nullable: false, eager: true })
  @JoinColumn({ name: 'warehouseId' })
  warehouse: Warehouse;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  quantity: string;
}
