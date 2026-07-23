import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import ExcelJS from 'exceljs';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Category } from '../entities/category.entity';
import { Brand } from '../entities/brand.entity';
import { Material } from '../entities/material.entity';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { PricingService } from '../../pricing/pricing.service';

const EXPORT_HEADERS = [
  'SKU',
  'Nombre del producto',
  'Descripción',
  'Categoría',
  'Marca',
  'Material',
  'Características',
  'Cuidados',
  'Talla',
  'Color',
  'Costo',
  'Precio sin descuento',
  '% Descuento',
  'Stock',
  'Precio',
];

interface ImportSkippedRow {
  row: number;
  sku: string;
  reason: string;
}

/** Serializa a texto legible: "Suela: PVC; Tacón: 5.5cm" */
function serializeCharacteristics(
  characteristics: Record<string, string> | null,
): string {
  if (!characteristics) return '';
  return Object.entries(characteristics)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

/**
 * Parsea "Suela: PVC; Tacón: 5.5cm" a { Suela: 'PVC', Tacón: '5.5cm' }.
 * Tolera JSON legado (formato anterior) para no romper archivos ya exportados.
 * Ignora pares mal formados en vez de descartar la fila completa.
 */
function parseCharacteristics(text: string): Record<string, string> {
  const trimmed = text.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // no era JSON válido; se intenta como texto clave: valor
    }
  }
  const result: Record<string, string> = {};
  for (const pair of trimmed.split(';')) {
    const idx = pair.indexOf(':');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key && value) result[key] = value;
  }
  return result;
}

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: ImportSkippedRow[];
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brands: Repository<Brand>,
    @InjectRepository(Material)
    private readonly materials: Repository<Material>,
    private readonly pricingService: PricingService,
  ) {}

  /** Precio de venta = precio sin descuento menos el % de descuento. */
  private computeFinalPrice(
    listPrice: string | null,
    discountPercent: string,
  ): number {
    const list = Number(listPrice) || 0;
    if (list <= 0) return 0;
    const discount = Number(discountPercent) || 0;
    return list * (1 - discount / 100);
  }

  /** Empuja el precio base de cada variante a la lista "Consumidor final". */
  private async syncConsumidorFinalPrices(product: Product): Promise<void> {
    for (const variant of product.variants) {
      const price = this.computeFinalPrice(variant.listPrice, variant.discountPercent);
      if (price > 0) {
        await this.pricingService.syncConsumidorFinalPrice(variant.id, price);
      }
    }
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const exists = await this.products.findOne({ where: { sku: dto.sku } });
    if (exists) throw new ConflictException('Ya existe un producto con ese SKU');
    const product = this.products.create({
      sku: dto.sku,
      name: dto.name,
      description: dto.description ?? null,
      characteristics: dto.characteristics ?? null,
      cuidados: dto.cuidados ?? null,
      brandId: dto.brandId ?? null,
      materialId: dto.materialId ?? null,
      unit: dto.unit ?? 'par',
      active: dto.active ?? true,
      categoryId: dto.categoryId ?? null,
      variants: (dto.variants ?? []).map((v) =>
        this.variants.create({
          size: v.size,
          color: v.color,
          barcode: v.barcode,
          cost: v.cost !== undefined ? String(v.cost) : '0',
          listPrice: v.listPrice !== undefined ? String(v.listPrice) : null,
          discountPercent:
            v.discountPercent !== undefined ? String(v.discountPercent) : '0',
          stockQty: v.stockQty ?? 0,
        }),
      ),
    });
    const saved = await this.products.save(product);
    await this.syncConsumidorFinalPrices(saved);
    return saved;
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
    if (dto.description !== undefined) product.description = dto.description ?? null;
    if (dto.characteristics !== undefined) {
      product.characteristics = dto.characteristics ?? null;
    }
    if (dto.cuidados !== undefined) product.cuidados = dto.cuidados ?? null;
    if (dto.brandId !== undefined) product.brandId = dto.brandId ?? null;
    if (dto.materialId !== undefined) product.materialId = dto.materialId ?? null;
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
          listPrice: v.listPrice !== undefined ? String(v.listPrice) : null,
          discountPercent:
            v.discountPercent !== undefined ? String(v.discountPercent) : '0',
          stockQty: v.stockQty ?? 0,
        }),
      );
    }
    const saved = await this.products.save(product);
    await this.syncConsumidorFinalPrices(saved);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.products.softRemove(product);
  }

  async exportToExcel(priceListId?: string): Promise<Buffer> {
    const products = await this.products.find({ order: { name: 'ASC' } });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Productos');
    sheet.addRow(['Listado de Productos']);
    sheet.addRow(['Se listan los Productos y se les asignan un precio']);
    sheet.addRow(EXPORT_HEADERS);

    for (const product of products) {
      const characteristics = serializeCharacteristics(product.characteristics);
      for (const variant of product.variants) {
        const price = priceListId
          ? await this.pricingService.getPrice(variant.id, priceListId)
          : '';
        sheet.addRow([
          product.sku,
          product.name,
          product.description ?? '',
          product.category?.name ?? '',
          product.brand?.name ?? '',
          product.material?.name ?? '',
          characteristics,
          product.cuidados ?? '',
          variant.size,
          variant.color,
          Number(variant.cost),
          variant.listPrice !== null ? Number(variant.listPrice) : '',
          Number(variant.discountPercent),
          variant.stockQty,
          price === '' ? '' : Number(price),
        ]);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async findOrCreateCategory(name: string): Promise<Category> {
    const existing = await this.categories.findOne({ where: { name } });
    if (existing) return existing;
    return this.categories.save(this.categories.create({ name }));
  }

  private async findOrCreateBrand(name: string): Promise<Brand> {
    const existing = await this.brands.findOne({ where: { name } });
    if (existing) return existing;
    return this.brands.save(this.brands.create({ name }));
  }

  private async findOrCreateMaterial(name: string): Promise<Material> {
    const existing = await this.materials.findOne({ where: { name } });
    if (existing) return existing;
    return this.materials.save(this.materials.create({ name }));
  }

  /** Cargue masivo de productos (crea o actualiza por SKU) desde un Excel. */
  async importFromExcel(buffer: Buffer): Promise<ImportSummary> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new BadRequestException('El archivo no tiene hojas');

    let headerRowNumber = -1;
    let columns: Record<string, number> = {};
    sheet.eachRow((row, rowNumber) => {
      if (headerRowNumber !== -1) return;
      const values = (row.values as unknown[]) ?? [];
      const normalized = values.map((v) =>
        typeof v === 'string' ? v.trim().toLowerCase() : v,
      );
      if (normalized.includes('sku')) {
        headerRowNumber = rowNumber;
        normalized.forEach((v, idx) => {
          if (typeof v === 'string') columns[v] = idx;
        });
      }
    });
    if (headerRowNumber === -1) {
      throw new BadRequestException('No se encontró la fila de encabezado (SKU)');
    }

    const col = {
      sku: columns['sku'],
      name: columns['nombre del producto'],
      description: columns['descripción'],
      category: columns['categoría'],
      brand: columns['marca'],
      material: columns['material'],
      characteristics: columns['características'],
      cuidados: columns['cuidados'],
      size: columns['talla'],
      color: columns['color'],
      cost: columns['costo'],
      listPrice: columns['precio sin descuento'],
      discountPercent: columns['% descuento'],
      stock: columns['stock'],
    };
    if (!col.sku || !col.name || !col.size || !col.color) {
      throw new BadRequestException(
        'El archivo debe tener al menos las columnas SKU, Nombre del producto, Talla y Color',
      );
    }

    const cell = (values: unknown[], idx: number | undefined): string =>
      idx ? String(values[idx] ?? '').trim() : '';

    interface RowData {
      row: number;
      name: string;
      description: string;
      category: string;
      brand: string;
      material: string;
      characteristics: string;
      cuidados: string;
      size: string;
      color: string;
      cost: number;
      listPrice: number | null;
      discountPercent: number;
      stockQty: number;
    }
    const bySku = new Map<string, RowData[]>();
    const skipped: ImportSkippedRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return;
      const values = row.values as unknown[];
      const sku = cell(values, col.sku);
      const size = cell(values, col.size);
      const color = cell(values, col.color);
      if (!sku && !size && !color) return; // fila vacía
      if (!sku || !size || !color) {
        skipped.push({ row: rowNumber, sku, reason: 'Faltan SKU, Talla o Color' });
        return;
      }
      const num = (idx: number | undefined): number => {
        if (!idx) return 0;
        const raw = values[idx];
        return typeof raw === 'number' ? raw : Number(raw) || 0;
      };
      const rawListPrice = col.listPrice ? values[col.listPrice] : undefined;
      const listPrice =
        rawListPrice === undefined || rawListPrice === null || rawListPrice === ''
          ? null
          : typeof rawListPrice === 'number'
            ? rawListPrice
            : Number(rawListPrice) || null;
      const list = bySku.get(sku) ?? [];
      list.push({
        row: rowNumber,
        name: cell(values, col.name),
        description: cell(values, col.description),
        category: cell(values, col.category),
        brand: cell(values, col.brand),
        material: cell(values, col.material),
        characteristics: cell(values, col.characteristics),
        cuidados: cell(values, col.cuidados),
        size,
        color,
        cost: num(col.cost),
        listPrice,
        discountPercent: num(col.discountPercent),
        stockQty: Math.round(num(col.stock)),
      });
      bySku.set(sku, list);
    });

    let created = 0;
    let updated = 0;

    for (const [sku, rows] of bySku) {
      const first = rows.find((r) => r.name) ?? rows[0];
      if (!first.name) {
        skipped.push({ row: first.row, sku, reason: 'Falta el nombre del producto' });
        continue;
      }

      const charText = rows.find((r) => r.characteristics)?.characteristics;
      let characteristics: Record<string, string> | undefined;
      if (charText) {
        const parsed = parseCharacteristics(charText);
        characteristics = Object.keys(parsed).length > 0 ? parsed : undefined;
      }

      const categoryName = rows.find((r) => r.category)?.category;
      const brandName = rows.find((r) => r.brand)?.brand;
      const materialName = rows.find((r) => r.material)?.material;
      const category = categoryName
        ? await this.findOrCreateCategory(categoryName)
        : undefined;
      const brand = brandName ? await this.findOrCreateBrand(brandName) : undefined;
      const material = materialName
        ? await this.findOrCreateMaterial(materialName)
        : undefined;

      const cuidadosText = rows.find((r) => r.cuidados)?.cuidados;

      let product = await this.products.findOne({ where: { sku } });
      if (!product) {
        product = this.products.create({
          sku,
          name: first.name,
          description: first.description || null,
          characteristics: characteristics ?? null,
          cuidados: cuidadosText || null,
          categoryId: category?.id ?? null,
          brandId: brand?.id ?? null,
          materialId: material?.id ?? null,
          variants: rows.map((r) =>
            this.variants.create({
              size: r.size,
              color: r.color,
              cost: String(r.cost),
              listPrice: r.listPrice !== null ? String(r.listPrice) : null,
              discountPercent: String(r.discountPercent),
              stockQty: r.stockQty,
            }),
          ),
        });
        await this.products.save(product);
        await this.syncConsumidorFinalPrices(product);
        created += 1;
      } else {
        product.name = first.name;
        if (first.description) product.description = first.description;
        if (characteristics) product.characteristics = characteristics;
        if (cuidadosText) product.cuidados = cuidadosText;
        if (category) product.categoryId = category.id;
        if (brand) product.brandId = brand.id;
        if (material) product.materialId = material.id;

        const existingVariants = [...product.variants];
        for (const r of rows) {
          const match = existingVariants.find(
            (v) => v.size === r.size && v.color === r.color,
          );
          if (match) {
            match.cost = String(r.cost);
            match.listPrice = r.listPrice !== null ? String(r.listPrice) : null;
            match.discountPercent = String(r.discountPercent);
            match.stockQty = r.stockQty;
          } else {
            product.variants.push(
              this.variants.create({
                size: r.size,
                color: r.color,
                cost: String(r.cost),
                listPrice: r.listPrice !== null ? String(r.listPrice) : null,
                discountPercent: String(r.discountPercent),
                stockQty: r.stockQty,
              }),
            );
          }
        }
        await this.products.save(product);
        await this.syncConsumidorFinalPrices(product);
        updated += 1;
      }
    }

    return { created, updated, skipped };
  }
}
