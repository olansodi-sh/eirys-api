import { IsIn, IsNumber, IsUUID } from 'class-validator';

/**
 * Ajuste de existencias de una variante en una bodega.
 * `mode = set` fija la cantidad; `mode = delta` la incrementa/decrementa.
 */
export class AdjustStockDto {
  @IsUUID()
  variantId: string;

  @IsUUID()
  warehouseId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  quantity: number;

  @IsIn(['set', 'delta'])
  mode: 'set' | 'delta';
}
