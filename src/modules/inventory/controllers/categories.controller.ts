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
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto/category.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../roles/permissions.catalog';

@ApiTags('inventory/categories')
@ApiBearerAuth()
@Controller('inventory/categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
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
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
