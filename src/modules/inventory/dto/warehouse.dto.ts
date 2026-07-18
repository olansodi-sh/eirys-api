import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isQuality?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateWarehouseDto extends PartialType(CreateWarehouseDto) {}
