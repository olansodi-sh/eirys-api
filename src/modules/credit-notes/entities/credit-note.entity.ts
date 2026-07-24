import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CreditNoteType {
  PARTIAL = 'partial',
  TOTAL = 'total',
}

/** Motivo de la devolución (catálogo cerrado, para reportes consistentes). */
export enum ReturnReason {
  PRODUCTO_DEFECTUOSO = 'producto_defectuoso',
  TALLA_COLOR_INCORRECTO = 'talla_color_incorrecto',
  CLIENTE_NO_SATISFECHO = 'cliente_no_satisfecho',
  ERROR_FACTURACION = 'error_facturacion',
  OTRO = 'otro',
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

  @Column({ type: 'enum', enum: ReturnReason })
  reason: ReturnReason;

  @Column({ type: 'text' })
  description: string;

  @Column({ default: false })
  restock: boolean;

  /** Vale generado como crédito a favor del cliente, si aplica. */
  @Column({ type: 'uuid', nullable: true })
  voucherId: string | null;
}
