import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../roles/permissions.catalog';

@ApiTags('inventory/products')
@ApiBearerAuth()
@Controller('inventory/products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  @Get()
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(id, dto);
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
