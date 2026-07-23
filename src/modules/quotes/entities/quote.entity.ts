import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { QuoteLine } from './quote-line.entity';
import { ThirdParty } from '../../third-parties/entities/third-party.entity';

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CONVERTED = 'converted',
}

/** Cotización / presupuesto, convertible a factura. */
@Entity('quotes')
export class Quote extends BaseEntity {
  @Index({ unique: true })
  @Column()
  number: string;

  @ManyToOne(() => ThirdParty, { nullable: true, eager: true })
  @JoinColumn({ name: 'thirdPartyId' })
  thirdParty: ThirdParty | null;

  @Column({ type: 'uuid', nullable: true })
  thirdPartyId: string | null;

  @Column({ type: 'enum', enum: QuoteStatus, default: QuoteStatus.DRAFT })
  status: QuoteStatus;

  @Column({ type: 'date', nullable: true })
  validUntil: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  discount: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: string;

  /** Factura generada al convertir la cotización. */
  @Column({ type: 'uuid', nullable: true })
  saleId: string | null;

  @OneToMany(() => QuoteLine, (line) => line.quote, {
    cascade: true,
    eager: true,
  })
  lines: QuoteLine[];
}
