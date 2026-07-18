import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskColumn } from './entities/task-column.entity';
import { Task } from './entities/task.entity';
import {
  CreateColumnDto,
  CreateTaskDto,
  MoveTaskDto,
  UpdateTaskDto,
} from './dto/tasks.dto';

const DEFAULT_COLUMNS = ['Por hacer', 'En progreso', 'Hecho'];

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskColumn)
    private readonly columns: Repository<TaskColumn>,
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
  ) {}

  /** Devuelve el tablero completo; crea columnas por defecto la primera vez. */
  async board() {
    let columns = await this.columns.find({ order: { order: 'ASC' } });
    if (columns.length === 0) {
      columns = await this.columns.save(
        DEFAULT_COLUMNS.map((name, i) =>
          this.columns.create({ name, order: i }),
        ),
      );
    }
    const tasks = await this.tasks.find({ order: { order: 'ASC' } });
    return columns.map((col) => ({
      ...col,
      tasks: tasks.filter((t) => t.columnId === col.id),
    }));
  }

  createColumn(dto: CreateColumnDto): Promise<TaskColumn> {
    return this.columns.save(this.columns.create(dto));
  }

  async createTask(dto: CreateTaskDto): Promise<Task> {
    const count = await this.tasks.count({
      where: { columnId: dto.columnId },
    });
    return this.tasks.save(
      this.tasks.create({
        title: dto.title,
        description: dto.description,
        columnId: dto.columnId,
        assigneeId: dto.assigneeId ?? null,
        order: count,
      }),
    );
  }

  async updateTask(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findTask(id);
    Object.assign(task, dto);
    return this.tasks.save(task);
  }

  async moveTask(id: string, dto: MoveTaskDto): Promise<Task> {
    const task = await this.findTask(id);
    task.columnId = dto.columnId;
    task.order = dto.order;
    return this.tasks.save(task);
  }

  async removeTask(id: string): Promise<void> {
    const task = await this.findTask(id);
    await this.tasks.softRemove(task);
  }

  private async findTask(id: string): Promise<Task> {
    const task = await this.tasks.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    return task;
  }
}
