import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateColumnDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  columnId: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class MoveTaskDto {
  @IsUUID()
  columnId: string;

  @IsInt()
  @Min(0)
  order: number;
}
