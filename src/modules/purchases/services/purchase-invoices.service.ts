import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  PurchaseInvoice,
  PurchaseDocumentType,
} from '../entities/purchase-invoice.entity';
import { PurchaseInvoiceLine } from '../entities/purchase-invoice-line.entity';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../entities/purchase-order.entity';
import { CreatePurchaseInvoiceDto } from '../dto/purchase-invoice.dto';
import { ProductVariant } from '../../inventory/entities/product-variant.entity';
import { Stock } from '../../inventory/entities/stock.entity';

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PurchaseInvoice)
    private readonly invoices: Repository<PurchaseInvoice>,
  ) {}

  /** Recibe una compra: aumenta stock y actualiza el costo de cada variante. */
  async create(dto: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
    if (!dto.lines?.length) {
      throw new BadRequestException('El documento no tiene líneas');
    }

    return this.dataSource.transaction(async (manager) => {
      const variantRepo = manager.getRepository(ProductVariant);
      const stockRepo = manager.getRepository(Stock);
      const invoiceRepo = manager.getRepository(PurchaseInvoice);

      let total = 0;
      const lines: PurchaseInvoiceLine[] = [];

      for (const l of dto.lines) {
        const variant = await variantRepo.findOne({
          where: { id: l.variantId },
        });
        if (!variant) {
          throw new NotFoundException(`Variante ${l.variantId} no existe`);
        }

        // Aumenta existencias en la bodega de destino.
        let stock = await stockRepo.findOne({
          where: { variantId: l.variantId, warehouseId: dto.warehouseId },
        });
        if (!stock) {
          stock = stockRepo.create({
            variantId: l.variantId,
            warehouseId: dto.warehouseId,
            quantity: '0',
          });
        }
        stock.quantity = String(Number(stock.quantity) + l.quantity);
        await stockRepo.save(stock);

        // Actualiza el costo de la variante al último costo de compra.
        variant.cost = String(l.unitCost);
        await variantRepo.save(variant);

        const lineTotal = l.quantity * l.unitCost;
        total += lineTotal;
        lines.push(
          manager.create(PurchaseInvoiceLine, {
            variantId: l.variantId,
            description: `${variant.size} / ${variant.color}`,
            quantity: String(l.quantity),
            unitCost: String(l.unitCost),
            total: String(lineTotal),
          }),
        );
      }

      const prefix =
        dto.documentType === PurchaseDocumentType.INVOICE ? 'FC' : 'DS';
      const count = await invoiceRepo.count({
        where: { documentType: dto.documentType },
      });
      const number = `${prefix}-${String(count + 1).padStart(5, '0')}`;

      const invoice = await invoiceRepo.save(
        invoiceRepo.create({
          number,
          documentType: dto.documentType,
          supplierId: dto.supplierId,
          warehouseId: dto.warehouseId,
          purchaseOrderId: dto.purchaseOrderId ?? null,
          supplierDocNumber: dto.supplierDocNumber,
          date: dto.date ?? new Date().toISOString().slice(0, 10),
          total: String(total),
          lines,
        }),
      );

      if (dto.purchaseOrderId) {
        const poRepo = manager.getRepository(PurchaseOrder);
        const po = await poRepo.findOne({
          where: { id: dto.purchaseOrderId },
        });
        if (po) {
          po.status = PurchaseOrderStatus.RECEIVED;
          await poRepo.save(po);
        }
      }

      return invoice;
    });
  }

  findAll(): Promise<PurchaseInvoice[]> {
    return this.invoices.find({ order: { createdAt: 'DESC' }, take: 100 });
  }
}
