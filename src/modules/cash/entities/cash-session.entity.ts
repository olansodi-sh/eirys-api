import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CashMovement } from './cash-movement.entity';

export enum CashSessionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

/** Sesión de caja (turno): apertura con fondo inicial y cierre con arqueo. */
@Entity('cash_sessions')
export class CashSession extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  warehouseId: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  openingAmount: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  countedAmount: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  expectedAmount: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  difference: string | null;

  @Column({
    type: 'enum',
    enum: CashSessionStatus,
    default: CashSessionStatus.OPEN,
  })
  status: CashSessionStatus;

  @Column({ type: 'timestamptz' })
  openedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @OneToMany(() => CashMovement, (m) => m.session)
  movements: CashMovement[];
}
