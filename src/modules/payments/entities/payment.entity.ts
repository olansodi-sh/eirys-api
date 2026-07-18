import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ThirdParty } from '../../third-parties/entities/third-party.entity';
import { PaymentAllocation } from './payment-allocation.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  VOUCHER = 'voucher',
  CREDIT = 'credit',
}

/** Pago recibido; puede aplicarse a una o varias facturas. */
@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => ThirdParty, { nullable: true, eager: true })
  @JoinColumn({ name: 'thirdPartyId' })
  thirdParty: ThirdParty | null;

  @Column({ type: 'uuid', nullable: true })
  thirdPartyId: string | null;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  cashSessionId: string | null;

  @Column({ type: 'timestamptz' })
  date: Date;

  @OneToMany(() => PaymentAllocation, (a) => a.payment, {
    cascade: true,
    eager: true,
  })
  allocations: PaymentAllocation[];
}
