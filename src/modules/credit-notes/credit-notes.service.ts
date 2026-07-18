import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CreditNote,
  CreditNoteType,
} from './entities/credit-note.entity';
import { CreateCreditNoteDto } from './dto/credit-note.dto';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { VouchersService } from '../vouchers/vouchers.service';

@Injectable()
export class CreditNotesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly vouchers: VouchersService,
    @InjectRepository(CreditNote)
    private readonly notes: Repository<CreditNote>,
  ) {}

  async create(dto: CreateCreditNoteDto): Promise<CreditNote> {
    return this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);
      const sale = await saleRepo.findOne({ where: { id: dto.saleId } });
      if (!sale) throw new NotFoundException('Factura no encontrada');
      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException('La factura ya está anulada');
      }

      const amount =
        dto.type === CreditNoteType.TOTAL
          ? Number(sale.total)
          : (dto.amount ?? 0);
      if (amount <= 0) {
        throw new BadRequestException('El monto de la nota debe ser mayor a 0');
      }
      if (amount > Number(sale.total) + 0.001) {
        throw new BadRequestException(
          'El monto supera el total de la factura',
        );
      }

      // Devolución de inventario (solo en devoluciones totales).
      if (dto.restock && dto.type === CreditNoteType.TOTAL) {
        const stockRepo = manager.getRepository(Stock);
        for (const line of sale.lines) {
          let stock = await stockRepo.findOne({
            where: {
              variantId: line.variantId,
              warehouseId: sale.warehouseId,
            },
          });
          if (!stock) {
            stock = stockRepo.create({
              variantId: line.variantId,
              warehouseId: sale.warehouseId,
              quantity: '0',
            });
          }
          stock.quantity = String(
            Number(stock.quantity) + Number(line.quantity),
          );
          await stockRepo.save(stock);
        }
      }

      if (dto.type === CreditNoteType.TOTAL) {
        sale.status = SaleStatus.CANCELLED;
        await saleRepo.save(sale);
      }

      let voucherId: string | null = null;
      if (dto.generateVoucher) {
        const voucher = await this.vouchers.issue(
          {
            amount,
            thirdPartyId: sale.thirdPartyId,
            reason: `Nota crédito factura ${sale.number}`,
          },
          manager,
        );
        voucherId = voucher.id;
      }

      const count = await manager.getRepository(CreditNote).count();
      const number = `NC-${String(count + 1).padStart(5, '0')}`;
      return manager.getRepository(CreditNote).save(
        manager.getRepository(CreditNote).create({
          number,
          saleId: sale.id,
          thirdPartyId: sale.thirdPartyId,
          type: dto.type,
          amount: String(amount),
          reason: dto.reason,
          restock: dto.restock ?? false,
          voucherId,
        }),
      );
    });
  }

  findAll(): Promise<CreditNote[]> {
    return this.notes.find({ order: { createdAt: 'DESC' } });
  }
}
