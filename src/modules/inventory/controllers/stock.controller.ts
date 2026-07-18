import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import { AdjustStockDto } from '../dto/stock.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../roles/permissions.catalog';

@ApiTags('inventory/stock')
@ApiBearerAuth()
@Controller('inventory/stock')
export class StockController {
  constructor(private readonly service: StockService) {}

  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  @Get()
  find(
    @Query('variantId') variantId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    if (variantId) return this.service.findByVariant(variantId);
    if (warehouseId) return this.service.findByWarehouse(warehouseId);
    return [];
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Post('adjust')
  adjust(@Body() dto: AdjustStockDto) {
    return this.service.adjust(dto);
  }
}
