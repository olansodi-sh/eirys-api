import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../roles/permissions.catalog';

@ApiTags('reports')
@ApiBearerAuth()
@RequirePermissions(PERMISSIONS.REPORTS_READ)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('daily')
  daily(@Query('date') date?: string) {
    return this.service.daily(date);
  }

  @Get('sales-by-date')
  salesByDate(@Query('from') from: string, @Query('to') to: string) {
    return this.service.salesByDate(from, to);
  }

  @Get('commercial-360')
  commercial360() {
    return this.service.commercial360();
  }

  @Get('cost-by-product')
  costByProduct() {
    return this.service.costByProduct();
  }

  @Get('cost-by-warehouse')
  costByWarehouse() {
    return this.service.costByWarehouse();
  }

  @Get('journal')
  journal(@Query('from') from: string, @Query('to') to: string) {
    return this.service.journal(from, to);
  }
}
