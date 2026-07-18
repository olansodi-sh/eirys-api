import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Task } from './task.entity';

/** Columna del tablero Kanban (p. ej. Por hacer / En progreso / Hecho). */
@Entity('task_columns')
export class TaskColumn extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @OneToMany(() => Task, (task) => task.column)
  tasks: Task[];
}
