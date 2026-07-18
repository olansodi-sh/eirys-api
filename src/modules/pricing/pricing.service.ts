import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceList } from './entities/price-list.entity';
import { PriceListItem } from './entities/price-list-item.entity';
import {
  CreatePriceListDto,
  SetPricesDto,
  UpdatePriceListDto,
} from './dto/pricing.dto';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PriceList)
    private readonly lists: Repository<PriceList>,
    @InjectRepository(PriceListItem)
    private readonly items: Repository<PriceListItem>,
  ) {}

  async create(dto: CreatePriceListDto): Promise<PriceList> {
    const exists = await this.lists.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Ya existe una lista con ese nombre');
    if (dto.isDefault) await this.clearDefault();
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
    if (dto.isDefault) await this.clearDefault();
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

  /** Precio de una variante en una lista concreta o en la lista por defecto. */
  async getPrice(variantId: string, priceListId?: string): Promise<number> {
    let listId = priceListId;
    if (!listId) {
      const def = await this.lists.findOne({ where: { isDefault: true } });
      listId = def?.id;
    }
    if (!listId) return 0;
    const item = await this.items.findOne({
      where: { priceListId: listId, variantId },
    });
    return item ? Number(item.price) : 0;
  }

  private async clearDefault(): Promise<void> {
    await this.lists.update({ isDefault: true }, { isDefault: false });
  }
}
