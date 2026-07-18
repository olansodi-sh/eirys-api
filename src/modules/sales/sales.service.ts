import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleLine } from './entities/sale-line.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Stock } from '../inventory/entities/stock.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { ThirdParty } from '../third-parties/entities/third-party.entity';
import {
  Payment,
  PaymentMethod,
} from '../payments/entities/payment.entity';
import { PaymentAllocation } from '../payments/entities/payment-allocation.entity';
import { CashService } from '../cash/cash.service';
import { CashMovementType } from '../cash/entities/cash-movement.entity';

@Injectable()
export class SalesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cash: CashService,
    @InjectRepository(Sale)
    private readonly sales: Repository<Sale>,
  ) {}

  /** Crea una venta descontando stock de forma transaccional. */
  async create(userId: string, dto: CreateSaleDto): Promise<Sale> {
    if (!dto.lines?.length) {
      throw new BadRequestException('La venta no tiene líneas');
    }

    // La sesión de caja se valida fuera de la transacción para fallar pronto.
    let cashSessionId: string | null = null;
    if (dto.payment?.method === PaymentMethod.CASH && dto.payment.amount > 0) {
      const session = await this.cash.requireOpenSession(userId);
      cashSessionId = session.id;
    }

    return this.dataSource.transaction(async (manager) => {
      const variantRepo = manager.getRepository(ProductVariant);
      const stockRepo = manager.getRepository(Stock);
      const saleRepo = manager.getRepository(Sale);

      const lines: SaleLine[] = [];
      let subtotal = 0;
      let discountTotal = 0;

      for (const line of dto.lines) {
        const variant = await variantRepo.findOne({
          where: { id: line.variantId },
        });
        if (!variant) {
          throw new NotFoundException(`Variante ${line.variantId} no existe`);
        }

        const stock = await stockRepo.findOne({
          where: { variantId: line.variantId, warehouseId: dto.warehouseId },
        });
        const available = stock ? Number(stock.quantity) : 0;
        if (available < line.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para la variante ${variant.size}/${variant.color} (disp. ${available})`,
          );
        }
        stock!.quantity = String(available - line.quantity);
        await stockRepo.save(stock!);

        const discount = line.discount ?? 0;
        const lineTotal = line.quantity * line.unitPrice - discount;
        subtotal += line.quantity * line.unitPrice;
        discountTotal += discount;

        lines.push(
          manager.getRepository(SaleLine).create({
            variantId: line.variantId,
            description: `${variant.size} / ${variant.color}`,
            quantity: String(line.quantity),
            unitPrice: String(line.unitPrice),
            discount: String(discount),
            tax: '0',
            total: String(lineTotal),
          }),
        );
      }

      const total = subtotal - discountTotal;
      const paidAmount = Math.min(dto.payment?.amount ?? 0, total);
      const status =
        paidAmount >= total
          ? SaleStatus.PAID
          : paidAmount > 0
            ? SaleStatus.PARTIAL
            : SaleStatus.CONFIRMED;

      const count = await saleRepo.count();
      const number = `F-${String(count + 1).padStart(5, '0')}`;

      const sale = await saleRepo.save(
        saleRepo.create({
          number,
          thirdPartyId: dto.thirdPartyId ?? null,
          priceListId: dto.priceListId ?? null,
          warehouseId: dto.warehouseId,
          userId,
          cashSessionId,
          subtotal: String(subtotal),
          discount: String(discountTotal),
          tax: '0',
          total: String(total),
          paidAmount: String(paidAmount),
          status,
          date: new Date(),
          lines,
        }),
      );

      if (dto.payment && dto.payment.amount > 0) {
        await this.registerPayment(manager, sale, userId, cashSessionId, dto);
      }

      // Saldo pendiente a cuenta del tercero (crédito).
      const pending = total - paidAmount;
      if (dto.thirdPartyId && pending > 0) {
        const tpRepo = manager.getRepository(ThirdParty);
        const tp = await tpRepo.findOne({ where: { id: dto.thirdPartyId } });
        if (tp) {
          tp.balance = String(Number(tp.balance) + pending);
          await tpRepo.save(tp);
        }
      }

      return sale;
    });
  }

  private async registerPayment(
    manager: EntityManager,
    sale: Sale,
    userId: string,
    cashSessionId: string | null,
    dto: CreateSaleDto,
  ): Promise<void> {
    const applied = Math.min(dto.payment!.amount, Number(sale.total));
    const payment = await manager.getRepository(Payment).save(
      manager.getRepository(Payment).create({
        thirdPartyId: dto.thirdPartyId ?? null,
        method: dto.payment!.method,
        amount: String(dto.payment!.amount),
        userId,
        cashSessionId,
        date: new Date(),
      }),
    );
    await manager.getRepository(PaymentAllocation).save(
      manager.getRepository(PaymentAllocation).create({
        paymentId: payment.id,
        saleId: sale.id,
        amount: String(applied),
      }),
    );
    if (dto.payment!.method === PaymentMethod.CASH && cashSessionId) {
      await this.cash.recordMovement(
        cashSessionId,
        CashMovementType.IN,
        dto.payment!.amount,
        `Venta ${sale.number}`,
        'sale',
        sale.id,
        manager,
      );
    }
  }

  findAll(): Promise<Sale[]> {
    return this.sales.find({ order: { date: 'DESC' }, take: 100 });
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.sales.findOne({ where: { id } });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }
}
