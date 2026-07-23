import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreatePriceListDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  consumidorFinal?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePriceListDto extends PartialType(CreatePriceListDto) {}

export class SetPriceItemDto {
  @IsUUID()
  variantId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}

export class SetPricesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetPriceItemDto)
  items: SetPriceItemDto[];
}

export class ImportPriceListDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  priceListId?: string;
}
