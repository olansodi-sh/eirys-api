import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditNote } from './entities/credit-note.entity';
import { CreditNotesService } from './credit-notes.service';
import { CreditNotesController } from './credit-notes.controller';
import { VouchersModule } from '../vouchers/vouchers.module';

@Module({
  imports: [TypeOrmModule.forFeature([CreditNote]), VouchersModule],
  controllers: [CreditNotesController],
  providers: [CreditNotesService],
})
export class CreditNotesModule {}
