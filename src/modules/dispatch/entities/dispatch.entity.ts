import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum DispatchType {
  IN = 'in',
  OUT = 'out',
}

export enum DispatchStatus {
  PENDING = 'pending',
  DONE = 'done',
}

export interface DispatchLine {
  variantId: string;
  description: string;
  quantity: number;
}

/** Control de entrada y salida a demanda (picking / recepción). */
@Entity('dispatches')
export class Dispatch extends BaseEntity {
  @Index({ unique: true })
  @Column()
  number: string;

  @Column({ type: 'enum', enum: DispatchType })
  type: DispatchType;

  @Column({ type: 'uuid', nullable: true })
  saleId: string | null;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'enum', enum: DispatchStatus, default: DispatchStatus.PENDING })
  status: DispatchStatus;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: '[]' })
  lines: DispatchLine[];
}
