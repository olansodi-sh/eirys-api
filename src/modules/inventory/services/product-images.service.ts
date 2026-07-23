import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { ProductImage } from '../entities/product-image.entity';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import {
  PRODUCT_IMAGES_DIR,
  PRODUCT_IMAGES_PUBLIC_PATH,
  saveProductImageFile,
} from '../storage/product-image.storage';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly images: Repository<ProductImage>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
  ) {}

  private async findProduct(productId: string): Promise<Product> {
    const product = await this.products.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  private async assertVariantBelongsToProduct(
    productId: string,
    variantId: string,
  ): Promise<void> {
    const variant = await this.variants.findOne({
      where: { id: variantId, productId },
    });
    if (!variant) throw new NotFoundException('Variante no encontrada');
  }

  private async findImage(productId: string, imageId: string): Promise<ProductImage> {
    const image = await this.images.findOne({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException('Imagen no encontrada');
    return image;
  }

  private async deleteFile(url: string): Promise<void> {
    const filename = url.split('/').pop();
    if (!filename) return;
    await unlink(join(PRODUCT_IMAGES_DIR, filename)).catch(() => undefined);
  }

  async addImage(
    productId: string,
    file: Express.Multer.File,
    variantId?: string | null,
  ): Promise<ProductImage> {
    await this.findProduct(productId);
    if (variantId) await this.assertVariantBelongsToProduct(productId, variantId);
    const filename = await saveProductImageFile(file);
    const count = await this.images.count({
      where: { productId, variantId: variantId ?? IsNull() },
    });
    const image = this.images.create({
      productId,
      variantId: variantId ?? null,
      url: `${PRODUCT_IMAGES_PUBLIC_PATH}/${filename}`,
      order: count,
    });
    return this.images.save(image);
  }

  async replaceImage(
    productId: string,
    imageId: string,
    file: Express.Multer.File,
  ): Promise<ProductImage> {
    const image = await this.findImage(productId, imageId);
    const filename = await saveProductImageFile(file);
    await this.deleteFile(image.url);
    image.url = `${PRODUCT_IMAGES_PUBLIC_PATH}/${filename}`;
    return this.images.save(image);
  }

  async removeImage(productId: string, imageId: string): Promise<void> {
    const image = await this.findImage(productId, imageId);
    await this.deleteFile(image.url);
    await this.images.remove(image);
  }
}
