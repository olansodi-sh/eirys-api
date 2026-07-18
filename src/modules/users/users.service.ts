import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      roleId: dto.roleId ?? null,
      active: dto.active ?? true,
    });
    return this.users.save(user);
  }

  findAll(): Promise<User[]> {
    return this.users.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  /** Incluye passwordHash y permisos del rol; usado por autenticación. */
  findByEmailWithSecret(email: string): Promise<User | null> {
    return this.users.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        active: true,
        roleId: true,
      },
      relations: { role: { permissions: true } },
    });
  }

  findByIdWithPermissions(id: string): Promise<User | null> {
    return this.users.findOne({
      where: { id },
      relations: { role: { permissions: true } },
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.email && dto.email !== user.email) {
      const exists = await this.users.findOne({
        where: { email: dto.email },
      });
      if (exists) throw new ConflictException('Ese email ya está en uso');
      user.email = dto.email;
    }
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.roleId !== undefined) user.roleId = dto.roleId;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 10);
    return this.users.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.users.softRemove(user);
  }
}
