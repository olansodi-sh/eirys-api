import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { ThirdParty, ThirdPartyType } from './entities/third-party.entity';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';

@Injectable()
export class ThirdPartiesService {
  constructor(
    @InjectRepository(ThirdParty)
    private readonly repo: Repository<ThirdParty>,
  ) {}

  create(dto: CreateThirdPartyDto): Promise<ThirdParty> {
    return this.repo.save(this.repo.create(dto));
  }

  findAll(type?: ThirdPartyType, search?: string): Promise<ThirdParty[]> {
    const where: FindOptionsWhere<ThirdParty>[] = [];
    const base: FindOptionsWhere<ThirdParty> = {};
    if (type) base.type = type;
    if (search) {
      where.push(
        { ...base, name: ILike(`%${search}%`) },
        { ...base, docNumber: ILike(`%${search}%`) },
      );
    }
    return this.repo.find({
      where: where.length ? where : base,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ThirdParty> {
    const tp = await this.repo.findOne({ where: { id } });
    if (!tp) throw new NotFoundException('Tercero no encontrado');
    return tp;
  }

  async update(id: string, dto: UpdateThirdPartyDto): Promise<ThirdParty> {
    const tp = await this.findOne(id);
    Object.assign(tp, dto);
    return this.repo.save(tp);
  }

  async remove(id: string): Promise<void> {
    const tp = await this.findOne(id);
    await this.repo.softRemove(tp);
  }
}
