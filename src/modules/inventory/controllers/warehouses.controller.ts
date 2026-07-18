import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WarehousesService } from '../services/warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../dto/warehouse.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../roles/permissions.catalog';

@ApiTags('inventory/warehouses')
@ApiBearerAuth()
@Controller('inventory/warehouses')
export class WarehousesController {
  constructor(private readonly service: WarehousesService) {}

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Post()
  create(@Body() dto: CreateWarehouseDto) {
    return this.service.create(dto);
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.service.update(id, dto);
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
