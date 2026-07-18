import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskColumn } from './entities/task-column.entity';
import { Task } from './entities/task.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaskColumn, Task])],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
