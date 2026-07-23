import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import ExcelJS from 'exceljs';
import { PriceList } from './entities/price-list.entity';
import { PriceListItem } from './entities/price-list-item.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import {
  CreatePriceListDto,
  ImportPriceListDto,
  SetPricesDto,
  UpdatePriceListDto,
} from './dto/pricing.dto';

export interface SkippedRow {
  row: number;
  sku: string;
  size: string;
  color: string;
  reason: string;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PriceList)
    private readonly lists: Repository<PriceList>,
    @InjectRepository(PriceListItem)
    private readonly items: Repository<PriceListItem>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
  ) {}

  async create(dto: CreatePriceListDto): Promise<PriceList> {
    const exists = await this.lists.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Ya existe una lista con ese nombre');
    if (dto.consumidorFinal) await this.clearConsumidorFinal();
    return this.lists.save(this.lists.create(dto));
  }

  findAll(): Promise<PriceList[]> {
    return this.lists.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<PriceList> {
    const list = await this.lists.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!list) throw new NotFoundException('Lista de precios no encontrada');
    return list;
  }

  async update(id: string, dto: UpdatePriceListDto): Promise<PriceList> {
    const list = await this.findOne(id);
    if (dto.consumidorFinal) await this.clearConsumidorFinal();
    Object.assign(list, dto);
    return this.lists.save(list);
  }

  async remove(id: string): Promise<void> {
    const list = await this.findOne(id);
    await this.lists.softRemove(list);
  }

  /** Fija (upsert) los precios de varias variantes en una lista. */
  async setPrices(id: string, dto: SetPricesDto): Promise<PriceListItem[]> {
    await this.findOne(id);
    const result: PriceListItem[] = [];
    for (const entry of dto.items) {
      let item = await this.items.findOne({
        where: { priceListId: id, variantId: entry.variantId },
      });
      if (!item) {
        item = this.items.create({
          priceListId: id,
          variantId: entry.variantId,
        });
      }
      item.price = String(entry.price);
      result.push(await this.items.save(item));
    }
    return result;
  }

  /** Precio de una variante en una lista concreta o en la lista de consumidor final. */
  async getPrice(variantId: string, priceListId?: string): Promise<number> {
    let listId = priceListId;
    if (!listId) {
      const def = await this.lists.findOne({ where: { consumidorFinal: true } });
      listId = def?.id;
    }
    if (!listId) return 0;
    const item = await this.items.findOne({
      where: { priceListId: listId, variantId },
    });
    return item ? Number(item.price) : 0;
  }

  private async clearConsumidorFinal(): Promise<void> {
    await this.lists.update({ consumidorFinal: true }, { consumidorFinal: false });
  }

  private async getOrCreateConsumidorFinalList(): Promise<PriceList> {
    const existing = await this.lists.findOne({ where: { consumidorFinal: true } });
    if (existing) return existing;
    return this.lists.save(
      this.lists.create({ name: 'Consumidor final', consumidorFinal: true }),
    );
  }

  /**
   * Sincroniza el precio calculado de una variante (precio sin descuento
   * menos el % de descuento) con la lista "Consumidor final", creándola si
   * aún no existe. Se llama al crear/editar productos desde el módulo de
   * inventario, que es la fuente del precio base.
   */
  async syncConsumidorFinalPrice(variantId: string, price: number): Promise<void> {
    if (price <= 0) return;
    const list = await this.getOrCreateConsumidorFinalList();
    let item = await this.items.findOne({
      where: { priceListId: list.id, variantId },
    });
    if (!item) {
      item = this.items.create({ priceListId: list.id, variantId });
    }
    item.price = price.toFixed(2);
    await this.items.save(item);
  }

  /** Crea o actualiza una lista de precios a partir de un Excel (misma
   * plantilla que exporta el listado de productos). */
  async importFromExcel(
    buffer: Buffer,
    dto: ImportPriceListDto,
  ): Promise<{ priceListId: string; applied: number; skipped: SkippedRow[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new BadRequestException('El archivo no tiene hojas');

    // Busca la fila de encabezado (contiene "SKU") y mapea columnas por nombre.
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
      size: columns['talla'],
      color: columns['color'],
      price: columns['precio'],
    };
    if (!col.sku || !col.size || !col.color || !col.price) {
      throw new BadRequestException(
        'El archivo debe tener las columnas SKU, Talla, Color y Precio',
      );
    }

    const allVariants = await this.variants.find({ relations: { product: true } });
    const variantMap = new Map<string, ProductVariant>();
    for (const v of allVariants) {
      variantMap.set(
        `${v.product.sku}|${v.size}|${v.color}`.toLowerCase(),
        v,
      );
    }

    const applied: { variantId: string; price: number }[] = [];
    const skipped: SkippedRow[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return;
      const values = row.values as unknown[];
      const sku = String(values[col.sku] ?? '').trim();
      const size = String(values[col.size] ?? '').trim();
      const color = String(values[col.color] ?? '').trim();
      const rawPrice = values[col.price];
      if (!sku && !size && !color) return; // fila vacía

      const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice);
      if (!rawPrice || Number.isNaN(price) || price <= 0) {
        skipped.push({ row: rowNumber, sku, size, color, reason: 'Precio inválido o vacío' });
        return;
      }

      const variant = variantMap.get(`${sku}|${size}|${color}`.toLowerCase());
      if (!variant) {
        skipped.push({ row: rowNumber, sku, size, color, reason: 'Variante no encontrada' });
        return;
      }

      applied.push({ variantId: variant.id, price });
    });

    let listId = dto.priceListId;
    if (listId) {
      const list = await this.findOne(listId);
      if (dto.name && dto.name !== list.name) {
        const nameTaken = await this.lists.findOne({ where: { name: dto.name } });
        if (nameTaken && nameTaken.id !== listId) {
          throw new ConflictException('Ya existe una lista con ese nombre');
        }
        list.name = dto.name;
        await this.lists.save(list);
      }
    } else {
      if (!dto.name) {
        throw new BadRequestException('Debe indicar un nombre para la nueva lista');
      }
      const created = await this.create({ name: dto.name });
      listId = created.id;
    }

    if (applied.length > 0) {
      await this.setPrices(listId, { items: applied });
    }

    return { priceListId: listId, applied: applied.length, skipped };
  }
}
