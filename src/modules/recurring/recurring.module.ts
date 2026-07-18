import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringInvoice } from './entities/recurring-invoice.entity';
import { RecurringService } from './recurring.service';
import { RecurringController } from './recurring.controller';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [TypeOrmModule.forFeature([RecurringInvoice]), SalesModule],
  controllers: [RecurringController],
  providers: [RecurringService],
})
export class RecurringModule {}
