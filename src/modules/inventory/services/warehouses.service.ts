import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../entities/warehouse.entity';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from '../dto/warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly repo: Repository<Warehouse>,
  ) {}

  create(dto: CreateWarehouseDto): Promise<Warehouse> {
    return this.repo.save(this.repo.create(dto));
  }

  findAll(): Promise<Warehouse[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Warehouse> {
    const wh = await this.repo.findOne({ where: { id } });
    if (!wh) throw new NotFoundException('Bodega no encontrada');
    return wh;
  }

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    const wh = await this.findOne(id);
    Object.assign(wh, dto);
    return this.repo.save(wh);
  }

  async remove(id: string): Promise<void> {
    const wh = await this.findOne(id);
    await this.repo.softRemove(wh);
  }
}
