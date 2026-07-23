import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

/**
 * Imagen de un producto (varias por producto, ordenables).
 * Si `variantId` es null, es una imagen general de la referencia;
 * si tiene valor, pertenece únicamente a esa variante (talla/color).
 */
@Entity('product_images')
export class ProductImage extends BaseEntity {
  @ManyToOne(() => Product, (p) => p.images, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => ProductVariant, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant | null;

  @Column({ type: 'uuid', nullable: true })
  variantId: string | null;

  /** Ruta pública (servida como estático), ej. /api/uploads/products/xxx.jpg */
  @Column()
  url: string;

  @Column({ type: 'int', default: 0 })
  order: number;
}
