import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SaleLine } from './sale-line.entity';
import { ThirdParty } from '../../third-parties/entities/third-party.entity';

export enum SaleStatus {
  CONFIRMED = 'confirmed',
  PARTIAL = 'partial',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

/** Factura / venta POS. */
@Entity('sales')
export class Sale extends BaseEntity {
  @Index({ unique: true })
  @Column()
  number: string;

  @ManyToOne(() => ThirdParty, { nullable: true, eager: true })
  @JoinColumn({ name: 'thirdPartyId' })
  thirdParty: ThirdParty | null;

  @Column({ type: 'uuid', nullable: true })
  thirdPartyId: string | null;

  @Column({ type: 'uuid', nullable: true })
  priceListId: string | null;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  cashSessionId: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  discount: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  tax: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  paidAmount: string;

  @Column({ type: 'enum', enum: SaleStatus, default: SaleStatus.CONFIRMED })
  status: SaleStatus;

  @Column({ type: 'timestamptz' })
  date: Date;

  // Reservado para facturación electrónica (DIAN) en fases futuras.
  @Column({ nullable: true })
  cufe: string;

  @Column({ nullable: true })
  electronicStatus: string;

  @OneToMany(() => SaleLine, (line) => line.sale, { cascade: true, eager: true })
  lines: SaleLine[];
}
