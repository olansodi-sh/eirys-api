import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../entities/purchase-order.entity';
import { PurchaseOrderLine } from '../entities/purchase-order-line.entity';
import { CreatePurchaseOrderDto } from '../dto/purchase-order.dto';
import { ProductVariant } from '../../inventory/entities/product-variant.entity';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly orders: Repository<PurchaseOrder>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
  ) {}

  async create(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    if (!dto.lines?.length) {
      throw new BadRequestException('La orden no tiene líneas');
    }
    let total = 0;
    const lines: PurchaseOrderLine[] = [];
    for (const l of dto.lines) {
      const variant = await this.variants.findOne({
        where: { id: l.variantId },
      });
      if (!variant) {
        throw new NotFoundException(`Variante ${l.variantId} no existe`);
      }
      const lineTotal = l.quantity * l.unitCost;
      total += lineTotal;
      lines.push(
        this.orders.manager.create(PurchaseOrderLine, {
          variantId: l.variantId,
          description: `${variant.size} / ${variant.color}`,
          quantity: String(l.quantity),
          unitCost: String(l.unitCost),
          total: String(lineTotal),
        }),
      );
    }
    const count = await this.orders.count();
    const number = `OC-${String(count + 1).padStart(5, '0')}`;
    return this.orders.save(
      this.orders.create({
        number,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        date: dto.date ?? new Date().toISOString().slice(0, 10),
        total: String(total),
        status: PurchaseOrderStatus.DRAFT,
        lines,
      }),
    );
  }

  findAll(): Promise<PurchaseOrder[]> {
    return this.orders.find({ order: { createdAt: 'DESC' }, take: 100 });
  }

  async findOne(id: string): Promise<PurchaseOrder> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Orden de compra no encontrada');
    return order;
  }

  async setStatus(
    id: string,
    status: PurchaseOrderStatus,
  ): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    order.status = status;
    return this.orders.save(order);
  }
}
