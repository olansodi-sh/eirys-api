import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';

/** Categoría jerárquica de productos. */
@Entity('categories')
export class Category extends BaseEntity {
  @Column()
  name: string;

  @ManyToOne(() => Category, (c) => c.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Category | null;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @OneToMany(() => Category, (c) => c.parent)
  children: Category[];

  @OneToMany(() => Product, (p) => p.category)
  products: Product[];
}
