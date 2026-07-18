import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission } from '../../modules/roles/entities/permission.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_NAMES,
} from '../../modules/roles/permissions.catalog';

/**
 * Puebla permisos, roles base y el usuario administrador en el arranque.
 * Es idempotente: solo crea lo que falta.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissions: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roles: Repository<Role>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get<string>('SEED_ON_BOOT', 'true') !== 'true') return;
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedAdmin();
  }

  private async seedPermissions(): Promise<void> {
    const existing = await this.permissions.find();
    const known = new Set(existing.map((p) => p.code));
    const toCreate = ALL_PERMISSIONS.filter((code) => !known.has(code));
    if (toCreate.length) {
      await this.permissions.save(
        toCreate.map((code) => this.permissions.create({ code })),
      );
      this.logger.log(`Permisos creados: ${toCreate.join(', ')}`);
    }
  }

  private async seedRoles(): Promise<void> {
    for (const [name, codes] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const perms = await this.permissions.find({
        where: { code: In(codes) },
      });
      let role = await this.roles.findOne({
        where: { name },
        relations: { permissions: true },
      });
      if (!role) {
        role = this.roles.create({ name, permissions: perms });
        await this.roles.save(role);
        this.logger.log(`Rol creado: ${name}`);
      } else {
        role.permissions = perms;
        await this.roles.save(role);
      }
    }
  }

  private async seedAdmin(): Promise<void> {
    const email = this.config.get<string>('ADMIN_EMAIL', 'admin@eirys.local');
    const exists = await this.users.findOne({ where: { email } });
    if (exists) return;
    const adminRole = await this.roles.findOne({
      where: { name: ROLE_NAMES.ADMIN },
    });
    const password = this.config.get<string>('ADMIN_PASSWORD', 'admin123');
    await this.users.save(
      this.users.create({
        name: 'Administrador',
        email,
        passwordHash: await bcrypt.hash(password, 10),
        roleId: adminRole?.id ?? null,
        active: true,
      }),
    );
    this.logger.log(`Usuario admin creado: ${email} (password: ${password})`);
  }
}
