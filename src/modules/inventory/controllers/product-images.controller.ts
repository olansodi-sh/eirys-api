import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ProductImagesService } from '../services/product-images.service';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../roles/permissions.catalog';

const imageFileValidator = new ParseFilePipe({
  validators: [new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)/ })],
});

@ApiTags('inventory/products/images')
@ApiBearerAuth()
@Controller('inventory/products/:productId/images')
export class ProductImagesController {
  constructor(private readonly service: ProductImagesService) {}

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('productId', ParseUUIDPipe) productId: string,
    @UploadedFile(imageFileValidator) file: Express.Multer.File,
    @Body('variantId') variantId?: string,
  ) {
    return this.service.addImage(productId, file, variantId || null);
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Patch(':imageId')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  replace(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @UploadedFile(imageFileValidator) file: Express.Multer.File,
  ) {
    return this.service.replaceImage(productId, imageId, file);
  }

  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  @Delete(':imageId')
  remove(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.service.removeImage(productId, imageId);
  }
}
