import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';

/**
 * Permiso atómico con formato `modulo.accion` (p. ej. `inventory.read`).
 */
@Entity('permissions')
export class Permission extends BaseEntity {
  @Index({ unique: true })
  @Column()
  code: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
