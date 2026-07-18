import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrderLine } from './purchase-order-line.entity';
import { ThirdParty } from '../../third-parties/entities/third-party.entity';

export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

/** Orden / pedido de compra a un proveedor. No mueve inventario por sí sola. */
@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @Index({ unique: true })
  @Column()
  number: string;

  @ManyToOne(() => ThirdParty, { nullable: false, eager: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: ThirdParty;

  @Column({ type: 'uuid' })
  supplierId: string;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.DRAFT,
  })
  status: PurchaseOrderStatus;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'date' })
  date: string;

  @OneToMany(() => PurchaseOrderLine, (line) => line.order, {
    cascade: true,
    eager: true,
  })
  lines: PurchaseOrderLine[];
}
