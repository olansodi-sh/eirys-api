import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SaleLine } from './entities/sale-line.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { CashModule } from '../cash/cash.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleLine]), CashModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
