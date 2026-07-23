import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PurchaseDocumentType } from '../entities/purchase-invoice.entity';
import { PurchaseLineDto } from './purchase-order.dto';

export class CreatePurchaseInvoiceDto {
  @IsEnum(PurchaseDocumentType)
  documentType: PurchaseDocumentType;

  @IsUUID()
  supplierId: string;

  @IsUUID()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  supplierDocNumber?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineDto)
  lines: PurchaseLineDto[];
}
