import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { ProductVariant } from '../../inventory/entities/product-variant.entity';

@Entity('purchase_order_lines')
export class PurchaseOrderLine extends BaseEntity {
  @ManyToOne(() => PurchaseOrder, (order) => order.lines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'orderId' })
  order: PurchaseOrder;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => ProductVariant, { nullable: false, eager: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ type: 'uuid' })
  variantId: string;

  @Column()
  description: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  quantity: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  unitCost: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: string;
}
