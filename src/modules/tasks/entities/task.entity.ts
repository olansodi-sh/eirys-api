import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TaskColumn } from './task-column.entity';

/** Tarjeta del tablero Kanban. */
@Entity('tasks')
export class Task extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => TaskColumn, (col) => col.tasks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'columnId' })
  column: TaskColumn;

  @Column({ type: 'uuid' })
  columnId: string;

  @Column({ type: 'uuid', nullable: true })
  assigneeId: string | null;

  @Column({ type: 'int', default: 0 })
  order: number;
}
