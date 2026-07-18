import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Dispatch,
  DispatchStatus,
} from './entities/dispatch.entity';
import { CreateDispatchDto } from './dto/dispatch.dto';

@Injectable()
export class DispatchService {
  constructor(
    @InjectRepository(Dispatch)
    private readonly repo: Repository<Dispatch>,
  ) {}

  async create(dto: CreateDispatchDto): Promise<Dispatch> {
    const count = await this.repo.count();
    const number = `D-${String(count + 1).padStart(5, '0')}`;
    return this.repo.save(
      this.repo.create({
        number,
        type: dto.type,
        saleId: dto.saleId ?? null,
        reference: dto.reference,
        notes: dto.notes,
        lines: dto.lines,
        status: DispatchStatus.PENDING,
      }),
    );
  }

  findAll(): Promise<Dispatch[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async markDone(id: string): Promise<Dispatch> {
    const dispatch = await this.repo.findOne({ where: { id } });
    if (!dispatch) throw new NotFoundException('Despacho no encontrado');
    dispatch.status = DispatchStatus.DONE;
    return this.repo.save(dispatch);
  }
}
