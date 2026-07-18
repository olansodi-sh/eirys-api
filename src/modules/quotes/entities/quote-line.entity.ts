import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Quote } from './quote.entity';
import { ProductVariant } from '../../inventory/entities/product-variant.entity';

@Entity('quote_lines')
export class QuoteLine extends BaseEntity {
  @ManyToOne(() => Quote, (quote) => quote.lines, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'quoteId' })
  quote: Quote;

  @Column({ type: 'uuid' })
  quoteId: string;

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

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: string;
}
