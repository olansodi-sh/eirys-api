import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { QuoteLine } from './entities/quote-line.entity';
import {
  ConvertQuoteDto,
  CreateQuoteDto,
  QuoteLineDto,
  UpdateQuoteDto,
} from './dto/quote.dto';
import { ProductVariant } from '../inventory/entities/product-variant.entity';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)
    private readonly quotes: Repository<Quote>,
    @InjectRepository(ProductVariant)
    private readonly variants: Repository<ProductVariant>,
    private readonly sales: SalesService,
  ) {}

  private async buildLines(
    lineDtos: QuoteLineDto[],
  ): Promise<{ lines: QuoteLine[]; subtotal: number; discountTotal: number }> {
    let subtotal = 0;
    let discountTotal = 0;
    const lines: QuoteLine[] = [];
    for (const l of lineDtos) {
      const variant = await this.variants.findOne({
        where: { id: l.variantId },
      });
      if (!variant) {
        throw new NotFoundException(`Variante ${l.variantId} no existe`);
      }
      const discount = l.discount ?? 0;
      const total = l.quantity * l.unitPrice - discount;
      subtotal += l.quantity * l.unitPrice;
      discountTotal += discount;
      lines.push(
        this.quotes.manager.create(QuoteLine, {
          variantId: l.variantId,
          description: `${variant.size} / ${variant.color}`,
          quantity: String(l.quantity),
          unitPrice: String(l.unitPrice),
          discount: String(discount),
          total: String(total),
        }),
      );
    }
    return { lines, subtotal, discountTotal };
  }

  async create(dto: CreateQuoteDto): Promise<Quote> {
    if (!dto.lines?.length) {
      throw new BadRequestException('La cotización no tiene líneas');
    }
    const { lines, subtotal, discountTotal } = await this.buildLines(
      dto.lines,
    );
    const count = await this.quotes.count();
    const number = `C-${String(count + 1).padStart(5, '0')}`;
    return this.quotes.save(
      this.quotes.create({
        number,
        thirdPartyId: dto.thirdPartyId ?? null,
        validUntil: dto.validUntil ?? null,
        subtotal: String(subtotal),
        discount: String(discountTotal),
        total: String(subtotal - discountTotal),
        status: QuoteStatus.DRAFT,
        lines,
      }),
    );
  }

  findAll(): Promise<Quote[]> {
    return this.quotes.find({ order: { createdAt: 'DESC' }, take: 100 });
  }

  async findOne(id: string): Promise<Quote> {
    const quote = await this.quotes.findOne({ where: { id } });
    if (!quote) throw new NotFoundException('Cotización no encontrada');
    return quote;
  }

  async setStatus(id: string, status: QuoteStatus): Promise<Quote> {
    const quote = await this.findOne(id);
    quote.status = status;
    return this.quotes.save(quote);
  }

  async update(id: string, dto: UpdateQuoteDto): Promise<Quote> {
    const quote = await this.findOne(id);
    if (quote.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException('No se puede editar una cotización convertida');
    }
    if (dto.thirdPartyId !== undefined) {
      quote.thirdPartyId = dto.thirdPartyId ?? null;
    }
    if (dto.validUntil !== undefined) {
      quote.validUntil = dto.validUntil ?? null;
    }
    if (dto.lines !== undefined) {
      if (!dto.lines.length) {
        throw new BadRequestException('La cotización no tiene líneas');
      }
      const { lines, subtotal, discountTotal } = await this.buildLines(
        dto.lines,
      );
      quote.lines = lines;
      quote.subtotal = String(subtotal);
      quote.discount = String(discountTotal);
      quote.total = String(subtotal - discountTotal);
    }
    return this.quotes.save(quote);
  }

  async remove(id: string): Promise<void> {
    const quote = await this.findOne(id);
    if (quote.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException('No se puede eliminar una cotización convertida');
    }
    await this.quotes.softRemove(quote);
  }

  /** Convierte la cotización en factura reutilizando el flujo de ventas. */
  async convert(id: string, userId: string, dto: ConvertQuoteDto) {
    const quote = await this.findOne(id);
    if (quote.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException('La cotización ya fue convertida');
    }
    const sale = await this.sales.create(userId, {
      warehouseId: dto.warehouseId,
      thirdPartyId: quote.thirdPartyId ?? undefined,
      lines: quote.lines.map((l) => ({
        variantId: l.variantId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        discount: Number(l.discount),
      })),
      payment:
        dto.paymentMethod && dto.paymentAmount && dto.paymentAmount > 0
          ? { method: dto.paymentMethod, amount: dto.paymentAmount }
          : undefined,
    });
    quote.status = QuoteStatus.CONVERTED;
    quote.saleId = sale.id;
    await this.quotes.save(quote);
    return sale;
  }
}
