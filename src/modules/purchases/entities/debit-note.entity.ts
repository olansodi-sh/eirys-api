import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Nota débito sobre una compra (cargo adicional a favor del proveedor). */
@Entity('debit_notes')
export class DebitNote extends BaseEntity {
  @Index({ unique: true })
  @Column()
  number: string;

  @Column({ type: 'uuid' })
  supplierId: string;

  @Column({ type: 'uuid', nullable: true })
  purchaseInvoiceId: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'date' })
  date: string;
}
