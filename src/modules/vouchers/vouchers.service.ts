import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Voucher, VoucherStatus } from './entities/voucher.entity';
import { CreateVoucherDto, RedeemVoucherDto } from './dto/voucher.dto';

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly vouchers: Repository<Voucher>,
  ) {}

  create(dto: CreateVoucherDto): Promise<Voucher> {
    return this.issue(
      {
        amount: dto.amount,
        thirdPartyId: dto.thirdPartyId ?? null,
        reason: dto.reason,
        expiresAt: dto.expiresAt ?? null,
      },
    );
  }

  /** Emite un vale; usable dentro de una transacción externa. */
  async issue(
    data: {
      amount: number;
      thirdPartyId?: string | null;
      reason?: string;
      expiresAt?: string | null;
    },
    manager?: EntityManager,
  ): Promise<Voucher> {
    const repo = manager ? manager.getRepository(Voucher) : this.vouchers;
    const count = await repo.count();
    const code = `V-${String(count + 1).padStart(5, '0')}`;
    return repo.save(
      repo.create({
        code,
        amount: String(data.amount),
        balance: String(data.amount),
        thirdPartyId: data.thirdPartyId ?? null,
        reason: data.reason,
        expiresAt: data.expiresAt ?? null,
        status: VoucherStatus.ACTIVE,
      }),
    );
  }

  findAll(): Promise<Voucher[]> {
    return this.vouchers.find({ order: { createdAt: 'DESC' } });
  }

  async findByCode(code: string): Promise<Voucher> {
    const voucher = await this.vouchers.findOne({ where: { code } });
    if (!voucher) throw new NotFoundException('Vale no encontrado');
    return voucher;
  }

  async redeem(code: string, dto: RedeemVoucherDto): Promise<Voucher> {
    const voucher = await this.findByCode(code);
    if (voucher.status !== VoucherStatus.ACTIVE) {
      throw new BadRequestException('El vale no está activo');
    }
    const balance = Number(voucher.balance);
    if (dto.amount > balance) {
      throw new BadRequestException(
        `Saldo insuficiente en el vale (disp. ${balance})`,
      );
    }
    const remaining = balance - dto.amount;
    voucher.balance = String(remaining);
    if (remaining <= 0) voucher.status = VoucherStatus.REDEEMED;
    return this.vouchers.save(voucher);
  }
}
