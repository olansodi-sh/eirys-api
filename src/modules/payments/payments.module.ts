import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { CashModule } from '../cash/cash.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymentAllocation]), CashModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
