import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment, PaymentMethod } from './entities/payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { ThirdParty } from '../third-parties/entities/third-party.entity';
import { CashService } from '../cash/cash.service';
import { CashMovementType } from '../cash/entities/cash-movement.entity';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cash: CashService,
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
  ) {}

  /** Registra un pago y lo aplica a facturas (abonos), de forma transaccional. */
  async create(userId: string, dto: CreatePaymentDto): Promise<Payment> {
    const allocated = dto.allocations.reduce((a, x) => a + x.amount, 0);
    if (allocated > dto.amount + 0.001) {
      throw new BadRequestException(
        'La suma aplicada supera el monto del pago',
      );
    }

    let cashSessionId: string | null = null;
    if (dto.method === PaymentMethod.CASH) {
      const session = await this.cash.requireOpenSession(userId);
      cashSessionId = session.id;
    }

    return this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);

      const payment = await manager.getRepository(Payment).save(
        manager.getRepository(Payment).create({
          thirdPartyId: dto.thirdPartyId ?? null,
          method: dto.method,
          amount: String(dto.amount),
          userId,
          cashSessionId,
          date: new Date(),
        }),
      );

      for (const alloc of dto.allocations) {
        const sale = await saleRepo.findOne({ where: { id: alloc.saleId } });
        if (!sale) {
          throw new NotFoundException(`Factura ${alloc.saleId} no existe`);
        }
        const newPaid = Number(sale.paidAmount) + alloc.amount;
        if (newPaid > Number(sale.total) + 0.001) {
          throw new BadRequestException(
            `El abono supera el saldo de la factura ${sale.number}`,
          );
        }
        sale.paidAmount = String(newPaid);
        sale.status =
          newPaid >= Number(sale.total)
            ? SaleStatus.PAID
            : SaleStatus.PARTIAL;
        await saleRepo.save(sale);

        await manager.getRepository(PaymentAllocation).save(
          manager.getRepository(PaymentAllocation).create({
            paymentId: payment.id,
            saleId: sale.id,
            amount: String(alloc.amount),
          }),
        );
      }

      if (dto.thirdPartyId) {
        const tpRepo = manager.getRepository(ThirdParty);
        const tp = await tpRepo.findOne({ where: { id: dto.thirdPartyId } });
        if (tp) {
          tp.balance = String(Number(tp.balance) - allocated);
          await tpRepo.save(tp);
        }
      }

      if (dto.method === PaymentMethod.CASH && cashSessionId) {
        await this.cash.recordMovement(
          cashSessionId,
          CashMovementType.IN,
          dto.amount,
          'Pago recibido',
          'payment',
          payment.id,
          manager,
        );
      }

      return payment;
    });
  }

  findAll(): Promise<Payment[]> {
    return this.payments.find({ order: { date: 'DESC' }, take: 100 });
  }
}
