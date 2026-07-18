import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../entities/stock.entity';
import { AdjustStockDto } from '../dto/stock.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly repo: Repository<Stock>,
  ) {}

  findByVariant(variantId: string): Promise<Stock[]> {
    return this.repo.find({ where: { variantId } });
  }

  findByWarehouse(warehouseId: string): Promise<Stock[]> {
    return this.repo.find({
      where: { warehouseId },
      relations: { variant: { product: true } },
    });
  }

  /** Fija o ajusta las existencias de una variante en una bodega. */
  async adjust(dto: AdjustStockDto): Promise<Stock> {
    let row = await this.repo.findOne({
      where: { variantId: dto.variantId, warehouseId: dto.warehouseId },
    });
    if (!row) {
      row = this.repo.create({
        variantId: dto.variantId,
        warehouseId: dto.warehouseId,
        quantity: '0',
      });
    }
    const current = Number(row.quantity);
    const next =
      dto.mode === 'set' ? dto.quantity : current + dto.quantity;
    row.quantity = String(next);
    return this.repo.save(row);
  }
}
