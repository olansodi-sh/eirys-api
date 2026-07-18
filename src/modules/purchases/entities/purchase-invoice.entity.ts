import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseInvoiceLine } from './purchase-invoice-line.entity';
import { ThirdParty } from '../../third-parties/entities/third-party.entity';

export enum PurchaseDocumentType {
  /** Factura de compra de proveedor obligado a facturar. */
  INVOICE = 'invoice',
  /** Documento de soporte (proveedor no obligado a facturar). */
  SUPPORT_DOCUMENT = 'support_document',
}

/** Factura de compra o documento de soporte; su recepción aumenta el inventario. */
@Entity('purchase_invoices')
export class PurchaseInvoice extends BaseEntity {
  @Index({ unique: true })
  @Column()
  number: string;

  @Column({ type: 'enum', enum: PurchaseDocumentType })
  documentType: PurchaseDocumentType;

  @ManyToOne(() => ThirdParty, { nullable: false, eager: true })
  @JoinColumn({ name: 'supplierId' })
  supplier: ThirdParty;

  @Column({ type: 'uuid' })
  supplierId: string;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @Column({ type: 'uuid', nullable: true })
  purchaseOrderId: string | null;

  /** Número del comprobante externo del proveedor (recepción de comprobantes). */
  @Column({ nullable: true })
  supplierDocNumber: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'date' })
  date: string;

  @OneToMany(() => PurchaseInvoiceLine, (line) => line.invoice, {
    cascade: true,
    eager: true,
  })
  lines: PurchaseInvoiceLine[];
}
