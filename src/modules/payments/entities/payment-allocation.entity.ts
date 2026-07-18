import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Payment } from './payment.entity';

/** Aplicación (parcial o total) de un pago a una factura. */
@Entity('payment_allocations')
export class PaymentAllocation extends BaseEntity {
  @ManyToOne(() => Payment, (p) => p.allocations, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ type: 'uuid' })
  paymentId: string;

  @Column({ type: 'uuid' })
  saleId: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;
}
