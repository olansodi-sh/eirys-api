import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { RecurringFrequency } from '../entities/recurring-invoice.entity';

export class RecurringLineDto {
  @IsUUID()
  variantId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}

export class CreateRecurringDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  thirdPartyId?: string;

  @IsUUID()
  warehouseId: string;

  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @IsString()
  nextRun: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecurringLineDto)
  lines: RecurringLineDto[];
}

export class UpdateRecurringDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  nextRun?: string;
}
