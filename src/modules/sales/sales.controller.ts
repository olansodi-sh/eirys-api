import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../roles/permissions.catalog';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @RequirePermissions(PERMISSIONS.SALES_WRITE)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSaleDto) {
    return this.service.create(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.SALES_READ)
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll({ search, from, to });
  }

  @RequirePermissions(PERMISSIONS.SALES_READ)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}
