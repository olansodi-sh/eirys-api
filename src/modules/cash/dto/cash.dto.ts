import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class OpenCashDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  openingAmount: number;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;
}

export class CloseCashDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  countedAmount: number;
}

export class CashMovementDto {
  @IsString()
  concept: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;
}
