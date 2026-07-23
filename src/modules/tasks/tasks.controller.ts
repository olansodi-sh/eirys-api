import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
  CreateColumnDto,
  CreateTaskDto,
  MoveTaskDto,
  UpdateTaskDto,
} from './dto/tasks.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../roles/permissions.catalog';

@ApiTags('tasks')
@ApiBearerAuth()
@RequirePermissions(PERMISSIONS.TASKS_MANAGE)
@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get('board')
  board() {
    return this.service.board();
  }

  @Post('columns')
  createColumn(@Body() dto: CreateColumnDto) {
    return this.service.createColumn(dto);
  }

  @Post()
  createTask(@Body() dto: CreateTaskDto) {
    return this.service.createTask(dto);
  }

  @Patch(':id')
  updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.service.updateTask(id, dto);
  }

  @Patch(':id/move')
  moveTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.service.moveTask(id, dto);
  }

  @Delete(':id')
  removeTask(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeTask(id);
  }
}
