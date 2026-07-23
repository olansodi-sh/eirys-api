import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Sale } from './sale.entity';
import { ProductVariant } from '../../inventory/entities/product-variant.entity';

@Entity('sale_lines')
export class SaleLine extends BaseEntity {
  @ManyToOne(() => Sale, (sale) => sale.lines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column({ type: 'uuid' })
  saleId: string;

  @ManyToOne(() => ProductVariant, { nullable: false, eager: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ type: 'uuid' })
  variantId: string;

  @Column()
  description: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  quantity: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  unitPrice: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  discount: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  tax: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: string;
}
