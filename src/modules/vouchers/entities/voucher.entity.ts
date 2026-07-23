import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ThirdParty } from '../../third-parties/entities/third-party.entity';

export enum VoucherStatus {
  ACTIVE = 'active',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
}

/** Vale / crédito a favor del cliente, redimible en ventas. */
@Entity('vouchers')
export class Voucher extends BaseEntity {
  @Index({ unique: true })
  @Column()
  code: string;

  @ManyToOne(() => ThirdParty, { nullable: true, eager: true })
  @JoinColumn({ name: 'thirdPartyId' })
  thirdParty: ThirdParty | null;

  @Column({ type: 'uuid', nullable: true })
  thirdPartyId: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  balance: string;

  @Column({ type: 'enum', enum: VoucherStatus, default: VoucherStatus.ACTIVE })
  status: VoucherStatus;

  @Column({ nullable: true })
  reason: string;

  @Column({ type: 'date', nullable: true })
  expiresAt: string | null;
}
