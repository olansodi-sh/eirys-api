import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { PurchaseInvoice } from './entities/purchase-invoice.entity';
import { PurchaseInvoiceLine } from './entities/purchase-invoice-line.entity';
import { DebitNote } from './entities/debit-note.entity';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { PurchaseOrdersService } from './services/purchase-orders.service';
import { PurchaseInvoicesService } from './services/purchase-invoices.service';
import { DebitNotesService } from './services/debit-notes.service';
import { PurchaseOrdersController } from './controllers/purchase-orders.controller';
import { PurchaseInvoicesController } from './controllers/purchase-invoices.controller';
import { DebitNotesController } from './controllers/debit-notes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderLine,
      PurchaseInvoice,
      PurchaseInvoiceLine,
      DebitNote,
      ProductVariant,
    ]),
  ],
  controllers: [
    PurchaseOrdersController,
    PurchaseInvoicesController,
    DebitNotesController,
  ],
  providers: [
    PurchaseOrdersService,
    PurchaseInvoicesService,
    DebitNotesService,
  ],
})
export class PurchasesModule {}
