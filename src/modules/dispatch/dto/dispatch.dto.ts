import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { DispatchType } from '../entities/dispatch.entity';

export class DispatchLineDto {
  @IsUUID()
  variantId: string;

  @IsString()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity: number;
}

export class CreateDispatchDto {
  @IsEnum(DispatchType)
  type: DispatchType;

  @IsOptional()
  @IsUUID()
  saleId?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispatchLineDto)
  lines: DispatchLineDto[];
}
