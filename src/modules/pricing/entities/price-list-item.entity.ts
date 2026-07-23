import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PriceList } from './price-list.entity';
import { ProductVariant } from '../../inventory/entities/product-variant.entity';

/** Precio de una variante dentro de una lista de precios. */
@Entity('price_list_items')
@Unique(['priceList', 'variant'])
export class PriceListItem extends BaseEntity {
  @ManyToOne(() => PriceList, (list) => list.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'priceListId' })
  priceList: PriceList;

  @Column({ type: 'uuid' })
  priceListId: string;

  @ManyToOne(() => ProductVariant, { nullable: false, eager: true })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @Column({ type: 'uuid' })
  variantId: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  price: string;
}
