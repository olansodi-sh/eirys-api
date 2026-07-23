import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
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
  @Get('export')
  async export(
    @Res() res: Response,
    @Query('priceListId') priceListId?: string,
  ) {
    const buffer = await this.service.exportToExcel(priceListId);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="productos.xlsx"',
    });
    res.send(buffer);
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Post('import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  importExcel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: /(spreadsheetml|xlsx|vnd\.ms-excel)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.service.importFromExcel(file.buffer);
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
