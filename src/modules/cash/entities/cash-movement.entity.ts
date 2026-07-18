import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CashSession } from './cash-session.entity';

export enum CashMovementType {
  IN = 'in',
  OUT = 'out',
}

/** Movimiento de caja: ingreso o egreso dentro de una sesión. */
@Entity('cash_movements')
export class CashMovement extends BaseEntity {
  @ManyToOne(() => CashSession, (s) => s.movements, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'sessionId' })
  session: CashSession;

  @Column({ type: 'uuid' })
  sessionId: string;

  @Column({ type: 'enum', enum: CashMovementType })
  type: CashMovementType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column()
  concept: string;

  /** Origen del movimiento, p. ej. `sale` / `payment` / `manual`. */
  @Column({ nullable: true })
  refType: string;

  @Column({ type: 'uuid', nullable: true })
  refId: string;
}
