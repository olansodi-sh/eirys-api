import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum RecurringFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export interface RecurringLine {
  variantId: string;
  quantity: number;
  unitPrice: number;
}

/** Plantilla de factura recurrente; genera ventas según su frecuencia. */
@Entity('recurring_invoices')
export class RecurringInvoice extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'uuid', nullable: true })
  thirdPartyId: string | null;

  @Column({ type: 'uuid' })
  warehouseId: string;

  @Column({ type: 'enum', enum: RecurringFrequency })
  frequency: RecurringFrequency;

  @Column({ type: 'date' })
  nextRun: string;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'jsonb', default: '[]' })
  lines: RecurringLine[];
}
