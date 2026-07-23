import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DebitNote } from '../entities/debit-note.entity';
import { CreateDebitNoteDto } from '../dto/debit-note.dto';

@Injectable()
export class DebitNotesService {
  constructor(
    @InjectRepository(DebitNote)
    private readonly repo: Repository<DebitNote>,
  ) {}

  async create(dto: CreateDebitNoteDto): Promise<DebitNote> {
    const count = await this.repo.count();
    const number = `ND-${String(count + 1).padStart(5, '0')}`;
    return this.repo.save(
      this.repo.create({
        number,
        supplierId: dto.supplierId,
        purchaseInvoiceId: dto.purchaseInvoiceId ?? null,
        amount: String(dto.amount),
        reason: dto.reason,
        date: dto.date ?? new Date().toISOString().slice(0, 10),
      }),
    );
  }

  findAll(): Promise<DebitNote[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }
}
