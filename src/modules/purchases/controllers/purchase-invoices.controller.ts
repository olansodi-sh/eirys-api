import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PurchaseInvoicesService } from '../services/purchase-invoices.service';
import { CreatePurchaseInvoiceDto } from '../dto/purchase-invoice.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../roles/permissions.catalog';

@ApiTags('purchases/invoices')
@ApiBearerAuth()
@Controller('purchases/invoices')
export class PurchaseInvoicesController {
  constructor(private readonly service: PurchaseInvoicesService) {}

  @RequirePermissions(PERMISSIONS.PURCHASES_WRITE)
  @Post()
  create(@Body() dto: CreatePurchaseInvoiceDto) {
    return this.service.create(dto);
  }

  @RequirePermissions(PERMISSIONS.PURCHASES_READ)
  @Get()
  findAll() {
    return this.service.findAll();
  }
}
