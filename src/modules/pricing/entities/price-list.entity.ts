import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PriceListItem } from './price-list-item.entity';

/** Lista de precios; la marcada `consumidorFinal` se usa por defecto en el POS. */
@Entity('price_lists')
export class PriceList extends BaseEntity {
  @Index({ unique: true })
  @Column()
  name: string;

  @Column({ default: false })
  consumidorFinal: boolean;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => PriceListItem, (item) => item.priceList, { cascade: true })
  items: PriceListItem[];
}
