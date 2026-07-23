import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateVoucherDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsUUID()
  thirdPartyId?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class RedeemVoucherDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}
