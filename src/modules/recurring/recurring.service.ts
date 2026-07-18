import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import {
  RecurringFrequency,
  RecurringInvoice,
} from './entities/recurring-invoice.entity';
import { CreateRecurringDto, UpdateRecurringDto } from './dto/recurring.dto';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class RecurringService {
  constructor(
    @InjectRepository(RecurringInvoice)
    private readonly repo: Repository<RecurringInvoice>,
    private readonly sales: SalesService,
  ) {}

  create(dto: CreateRecurringDto): Promise<RecurringInvoice> {
    return this.repo.save(this.repo.create(dto));
  }

  findAll(): Promise<RecurringInvoice[]> {
    return this.repo.find({ order: { nextRun: 'ASC' } });
  }

  async update(id: string, dto: UpdateRecurringDto): Promise<RecurringInvoice> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Plantilla no encontrada');
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /** Genera facturas para las plantillas vencidas y avanza su próxima fecha. */
  async run(userId: string): Promise<{ generated: number; numbers: string[] }> {
    const today = new Date().toISOString().slice(0, 10);
    const due = await this.repo.find({
      where: { active: true, nextRun: LessThanOrEqual(today) },
    });
    const numbers: string[] = [];
    for (const template of due) {
      const sale = await this.sales.create(userId, {
        warehouseId: template.warehouseId,
        thirdPartyId: template.thirdPartyId ?? undefined,
        lines: template.lines.map((l) => ({
          variantId: l.variantId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      numbers.push(sale.number);
      template.nextRun = this.advance(template.nextRun, template.frequency);
      await this.repo.save(template);
    }
    return { generated: numbers.length, numbers };
  }

  private advance(date: string, frequency: RecurringFrequency): string {
    const d = new Date(date);
    if (frequency === RecurringFrequency.WEEKLY) {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    return d.toISOString().slice(0, 10);
  }
}
