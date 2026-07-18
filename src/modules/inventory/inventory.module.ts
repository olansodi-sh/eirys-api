import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Stock } from './entities/stock.entity';
import { CategoriesService } from './services/categories.service';
import { WarehousesService } from './services/warehouses.service';
import { ProductsService } from './services/products.service';
import { StockService } from './services/stock.service';
import { CategoriesController } from './controllers/categories.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { ProductsController } from './controllers/products.controller';
import { StockController } from './controllers/stock.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Category,
      Product,
      ProductVariant,
      Warehouse,
      Stock,
    ]),
  ],
  controllers: [
    CategoriesController,
    WarehousesController,
    ProductsController,
    StockController,
  ],
  providers: [
    CategoriesService,
    WarehousesService,
    ProductsService,
    StockService,
  ],
  exports: [ProductsService, StockService, WarehousesService],
})
export class InventoryModule {}
