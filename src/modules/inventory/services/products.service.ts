import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const exists = await this.products.findOne({ where: { sku: dto.sku } });
    if (exists) throw new ConflictException('Ya existe un producto con ese SKU');
    const product = this.products.create({
      sku: dto.sku,
      name: dto.name,
      brand: dto.brand,
      material: dto.material,
      unit: dto.unit ?? 'par',
      active: dto.active ?? true,
      categoryId: dto.categoryId ?? null,
      variants: (dto.variants ?? []).map((v) =>
        this.variants.create({
          size: v.size,
          color: v.color,
          barcode: v.barcode,
          cost: v.cost !== undefined ? String(v.cost) : '0',
        }),
      ),
    });
    return this.products.save(product);
  }

  findAll(search?: string): Promise<Product[]> {
    const where = search
      ? [{ name: ILike(`%${search}%`) }, { sku: ILike(`%${search}%`) }]
      : {};
    return this.products.find({ where, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.products.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (dto.sku && dto.sku !== product.sku) {
      const exists = await this.products.findOne({ where: { sku: dto.sku } });
      if (exists) throw new ConflictException('Ese SKU ya está en uso');
      product.sku = dto.sku;
    }
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.brand !== undefined) product.brand = dto.brand;
    if (dto.material !== undefined) product.material = dto.material;
    if (dto.unit !== undefined) product.unit = dto.unit;
    if (dto.active !== undefined) product.active = dto.active;
    if (dto.categoryId !== undefined) {
      product.categoryId = dto.categoryId ?? null;
    }
    if (dto.variants !== undefined) {
      // Reemplaza el set de variantes; conserva ids existentes cuando se envían.
      product.variants = dto.variants.map((v) =>
        this.variants.create({
          id: v.id,
          size: v.size,
          color: v.color,
          barcode: v.barcode,
          cost: v.cost !== undefined ? String(v.cost) : '0',
        }),
      );
    }
    return this.products.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.products.softRemove(product);
  }
}
