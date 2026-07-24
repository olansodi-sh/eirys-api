import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { CreditNoteType, ReturnReason } from '../entities/credit-note.entity';

export class CreateCreditNoteDto {
  @IsUUID()
  saleId: string;

  @IsEnum(CreditNoteType)
  type: CreditNoteType;

  /** Monto para tipo `partial`. En `total` se toma el total de la factura. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @IsString()
  @IsNotEmpty()
  description: string;

  /** Devolver las unidades al inventario (solo tipo total). */
  @IsOptional()
  @IsBoolean()
  restock?: boolean;

  /** Emitir un vale por el monto a favor del cliente. */
  @IsOptional()
  @IsBoolean()
  generateVoucher?: boolean;
}
