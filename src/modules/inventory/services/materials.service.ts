import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../entities/material.entity';
import { CreateMaterialDto, UpdateMaterialDto } from '../dto/material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly repo: Repository<Material>,
  ) {}

  async create(dto: CreateMaterialDto): Promise<Material> {
    const exists = await this.repo.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Ya existe un material con ese nombre');
    return this.repo.save(
      this.repo.create({ name: dto.name, active: dto.active ?? true }),
    );
  }

  findAll(): Promise<Material[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Material> {
    const material = await this.repo.findOne({ where: { id } });
    if (!material) throw new NotFoundException('Material no encontrado');
    return material;
  }

  async update(id: string, dto: UpdateMaterialDto): Promise<Material> {
    const material = await this.findOne(id);
    if (dto.name !== undefined && dto.name !== material.name) {
      const exists = await this.repo.findOne({ where: { name: dto.name } });
      if (exists) throw new ConflictException('Ya existe un material con ese nombre');
      material.name = dto.name;
    }
    if (dto.active !== undefined) material.active = dto.active;
    return this.repo.save(material);
  }

  async remove(id: string): Promise<void> {
    const material = await this.findOne(id);
    await this.repo.softRemove(material);
  }
}
