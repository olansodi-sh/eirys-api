import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './entities/quote.entity';
import { QuoteLine } from './entities/quote-line.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, QuoteLine, ProductVariant]),
    SalesModule,
  ],
  controllers: [QuotesController],
  providers: [QuotesService],
})
export class QuotesModule {}
