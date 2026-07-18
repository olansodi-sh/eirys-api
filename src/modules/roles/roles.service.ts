import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
  ) {}

  private resolvePermissions(codes?: string[]): Promise<Permission[]> {
    if (!codes || codes.length === 0) return Promise.resolve([]);
    return this.permissions.find({ where: { code: In(codes) } });
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const exists = await this.roles.findOne({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Ya existe un rol con ese nombre');
    const role = this.roles.create({
      name: dto.name,
      description: dto.description,
      permissions: await this.resolvePermissions(dto.permissionCodes),
    });
    return this.roles.save(role);
  }

  findAll(): Promise<Role[]> {
    return this.roles.find({
      relations: { permissions: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roles.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissionCodes !== undefined) {
      role.permissions = await this.resolvePermissions(dto.permissionCodes);
    }
    return this.roles.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.roles.softRemove(role);
  }

  findAllPermissions(): Promise<Permission[]> {
    return this.permissions.find({ order: { code: 'ASC' } });
  }
}
