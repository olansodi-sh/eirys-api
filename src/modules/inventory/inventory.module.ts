import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingModule } from '../pricing/pricing.module';
import { Category } from './entities/category.entity';
import { Brand } from './entities/brand.entity';
import { Material } from './entities/material.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Stock } from './entities/stock.entity';
import { CategoriesService } from './services/categories.service';
import { BrandsService } from './services/brands.service';
import { MaterialsService } from './services/materials.service';
import { WarehousesService } from './services/warehouses.service';
import { ProductsService } from './services/products.service';
import { ProductImagesService } from './services/product-images.service';
import { StockService } from './services/stock.service';
import { CategoriesController } from './controllers/categories.controller';
import { BrandsController } from './controllers/brands.controller';
import { MaterialsController } from './controllers/materials.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { ProductsController } from './controllers/products.controller';
import { ProductImagesController } from './controllers/product-images.controller';
import { StockController } from './controllers/stock.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Brand,
      Material,
      Product,
      ProductVariant,
      ProductImage,
      Warehouse,
      Stock,
    ]),
    PricingModule,
  ],
  controllers: [
    CategoriesController,
    BrandsController,
    MaterialsController,
    WarehousesController,
    ProductsController,
    ProductImagesController,
    StockController,
  ],
  providers: [
    CategoriesService,
    BrandsService,
    MaterialsService,
    WarehousesService,
    ProductsService,
    ProductImagesService,
    StockService,
  ],
  exports: [ProductsService, StockService, WarehousesService],
})
export class InventoryModule {}
