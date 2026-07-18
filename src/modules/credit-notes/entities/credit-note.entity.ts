import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CreditNoteType {
  PARTIAL = 'partial',
  TOTAL = 'total',
}

/** Nota crédito sobre una factura (devolución parcial o total). */
@Entity('credit_notes')
export class CreditNote extends BaseEntity {
  @Index({ unique: true })
  @Column()
  number: string;

  @Column({ type: 'uuid' })
  saleId: string;

  @Column({ type: 'uuid', nullable: true })
  thirdPartyId: string | null;

  @Column({ type: 'enum', enum: CreditNoteType })
  type: CreditNoteType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ default: false })
  restock: boolean;

  /** Vale generado como crédito a favor del cliente, si aplica. */
  @Column({ type: 'uuid', nullable: true })
  voucherId: string | null;
}
