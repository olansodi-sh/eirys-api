import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  EntityManager,
  FindOperator,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
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
          relations: { product: true },
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
            description: `${variant.product?.name ?? 'Producto'} · ${variant.size} / ${variant.color}`,
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

      const thirdPartyRepo = manager.getRepository(ThirdParty);
      const thirdParty = dto.thirdPartyId
        ? await thirdPartyRepo.findOne({ where: { id: dto.thirdPartyId } })
        : null;

      const sale = await saleRepo.save(
        saleRepo.create({
          number,
          thirdPartyId: dto.thirdPartyId ?? null,
          clientName: thirdParty?.name ?? null,
          clientDocType: thirdParty?.docType ?? null,
          clientDocNumber: thirdParty?.docNumber ?? null,
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
      if (thirdParty && pending > 0) {
        thirdParty.balance = String(Number(thirdParty.balance) + pending);
        await thirdPartyRepo.save(thirdParty);
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

  async findAll(params?: {
    search?: string;
    from?: string;
    to?: string;
  }): Promise<Sale[]> {
    const { search, from, to } = params ?? {};

    let dateFilter: FindOperator<Date> | undefined;
    if (from && to) {
      dateFilter = Between(new Date(`${from}T00:00:00`), new Date(`${to}T23:59:59.999`));
    } else if (from) {
      dateFilter = MoreThanOrEqual(new Date(`${from}T00:00:00`));
    } else if (to) {
      dateFilter = LessThanOrEqual(new Date(`${to}T23:59:59.999`));
    }

    if (!search) {
      return this.sales.find({
        where: dateFilter ? { date: dateFilter } : {},
        order: { date: 'DESC' },
        take: 100,
      });
    }

    // Busca por número de factura o nombre del cliente.
    const [byNumber, byClient] = await Promise.all([
      this.sales.find({
        where: { number: ILike(`%${search}%`), ...(dateFilter ? { date: dateFilter } : {}) },
        order: { date: 'DESC' },
        take: 100,
      }),
      this.sales.find({
        where: {
          thirdParty: { name: ILike(`%${search}%`) },
          ...(dateFilter ? { date: dateFilter } : {}),
        },
        order: { date: 'DESC' },
        take: 100,
      }),
    ]);
    const byId = new Map([...byNumber, ...byClient].map((s) => [s.id, s]));
    return [...byId.values()].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.sales.findOne({ where: { id } });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    return sale;
  }
}
