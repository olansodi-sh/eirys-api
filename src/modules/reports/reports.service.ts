import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { SaleLine } from '../sales/entities/sale-line.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { PurchaseInvoice } from '../purchases/entities/purchase-invoice.entity';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly sales: Repository<Sale>,
    @InjectRepository(SaleLine)
    private readonly saleLines: Repository<SaleLine>,
    @InjectRepository(Stock)
    private readonly stock: Repository<Stock>,
    @InjectRepository(PurchaseInvoice)
    private readonly purchases: Repository<PurchaseInvoice>,
  ) {}

  /** Reporte del día: ventas, ingresos y ticket promedio. */
  async daily(date = today()) {
    const from = new Date(`${date}T00:00:00`);
    const to = new Date(`${date}T23:59:59.999`);
    const rows = await this.sales.find({
      where: { date: Between(from, to) },
    });
    const active = rows.filter((s) => s.status !== SaleStatus.CANCELLED);
    const total = active.reduce((a, s) => a + Number(s.total), 0);
    const paid = active.reduce((a, s) => a + Number(s.paidAmount), 0);
    return {
      date,
      salesCount: active.length,
      cancelledCount: rows.length - active.length,
      total,
      paid,
      pending: total - paid,
      averageTicket: active.length ? total / active.length : 0,
    };
  }

  /** Ventas por fecha de factura en un rango. */
  async salesByDate(from: string, to: string) {
    const rows = await this.sales.find({
      where: {
        date: Between(new Date(`${from}T00:00:00`), new Date(`${to}T23:59:59.999`)),
      },
      order: { date: 'ASC' },
    });
    const items = rows.map((s) => ({
      id: s.id,
      number: s.number,
      date: s.date,
      client: s.thirdParty?.name ?? 'Consumidor final',
      total: Number(s.total),
      status: s.status,
    }));
    return {
      from,
      to,
      count: items.length,
      total: items
        .filter((i) => i.status !== 'cancelled')
        .reduce((a, i) => a + i.total, 0),
      items,
    };
  }

  /** Análisis comercial 360: top productos y top clientes. */
  async commercial360() {
    const topProducts = await this.saleLines
      .createQueryBuilder('sl')
      .innerJoin('product_variants', 'pv', 'pv.id = sl.variantId')
      .innerJoin('products', 'p', 'p.id = pv.productId')
      .select('p.name', 'name')
      .addSelect('SUM(sl.quantity)', 'units')
      .addSelect('SUM(sl.total)', 'total')
      .groupBy('p.id')
      .addGroupBy('p.name')
      .orderBy('total', 'DESC')
      .limit(10)
      .getRawMany();

    const topClients = await this.sales
      .createQueryBuilder('s')
      .leftJoin('third_parties', 'tp', 'tp.id = s.thirdPartyId')
      .where('s.status != :c', { c: SaleStatus.CANCELLED })
      .select("COALESCE(tp.name, 'Consumidor final')", 'name')
      .addSelect('COUNT(s.id)', 'orders')
      .addSelect('SUM(s.total)', 'total')
      .groupBy('tp.id')
      .addGroupBy('tp.name')
      .orderBy('total', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      topProducts: topProducts.map((r) => ({
        name: r.name,
        units: Number(r.units),
        total: Number(r.total),
      })),
      topClients: topClients.map((r) => ({
        name: r.name,
        orders: Number(r.orders),
        total: Number(r.total),
      })),
    };
  }

  /** Costo del inventario por producto (existencias × costo). */
  async costByProduct() {
    const rows = await this.stock
      .createQueryBuilder('s')
      .innerJoin('product_variants', 'pv', 'pv.id = s.variantId')
      .innerJoin('products', 'p', 'p.id = pv.productId')
      .select('p.name', 'name')
      .addSelect('SUM(s.quantity)', 'units')
      .addSelect('SUM(s.quantity * pv.cost)', 'value')
      .groupBy('p.id')
      .addGroupBy('p.name')
      .orderBy('value', 'DESC')
      .getRawMany();
    return rows.map((r) => ({
      name: r.name,
      units: Number(r.units),
      value: Number(r.value),
    }));
  }

  /** Costo del inventario por bodega (valorización). */
  async costByWarehouse() {
    const rows = await this.stock
      .createQueryBuilder('s')
      .innerJoin('product_variants', 'pv', 'pv.id = s.variantId')
      .innerJoin('warehouses', 'w', 'w.id = s.warehouseId')
      .select('w.name', 'name')
      .addSelect('SUM(s.quantity * pv.cost)', 'value')
      .groupBy('w.id')
      .addGroupBy('w.name')
      .orderBy('value', 'DESC')
      .getRawMany();
    return rows.map((r) => ({ name: r.name, value: Number(r.value) }));
  }

  /** Libro diario operativo: ingresos (ventas) y egresos (compras) por fecha. */
  async journal(from: string, to: string) {
    const fromD = new Date(`${from}T00:00:00`);
    const toD = new Date(`${to}T23:59:59.999`);
    const sales = await this.sales.find({
      where: { date: Between(fromD, toD) },
    });
    const purchases = await this.purchases.find({
      where: { date: Between(from, to) },
    });

    const entries = [
      ...sales
        .filter((s) => s.status !== SaleStatus.CANCELLED)
        .map((s) => ({
          date: (s.date as unknown as Date).toISOString().slice(0, 10),
          type: 'Venta',
          reference: s.number,
          income: Number(s.total),
          expense: 0,
        })),
      ...purchases.map((p) => ({
        date: p.date,
        type:
          p.documentType === 'invoice' ? 'Compra' : 'Doc. soporte',
        reference: p.number,
        income: 0,
        expense: Number(p.total),
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    return {
      from,
      to,
      totalIncome: entries.reduce((a, e) => a + e.income, 0),
      totalExpense: entries.reduce((a, e) => a + e.expense, 0),
      entries,
    };
  }
}
