import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { ProductVariant } from '../../inventory/entities/product-variant.entity';

@Entity('purchase_invoice_lines')
export class PurchaseInvoiceLine extends BaseEntity {
  @ManyToOne(() => PurchaseInvoice, (invoice) => invoice.lines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: PurchaseInvoice;

  @Column({ type: 'uuid' })
  invoiceId: string;

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
