import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  CashSession,
  CashSessionStatus,
} from './entities/cash-session.entity';
import {
  CashMovement,
  CashMovementType,
} from './entities/cash-movement.entity';
import { CashMovementDto, CloseCashDto, OpenCashDto } from './dto/cash.dto';

@Injectable()
export class CashService {
  constructor(
    @InjectRepository(CashSession)
    private readonly sessions: Repository<CashSession>,
    @InjectRepository(CashMovement)
    private readonly movements: Repository<CashMovement>,
  ) {}

  getOpenSession(userId: string): Promise<CashSession | null> {
    return this.sessions.findOne({
      where: { userId, status: CashSessionStatus.OPEN },
    });
  }

  async requireOpenSession(userId: string): Promise<CashSession> {
    const session = await this.getOpenSession(userId);
    if (!session) {
      throw new BadRequestException('No hay una sesión de caja abierta');
    }
    return session;
  }

  async open(userId: string, dto: OpenCashDto): Promise<CashSession> {
    const current = await this.getOpenSession(userId);
    if (current) {
      throw new BadRequestException('Ya tiene una sesión de caja abierta');
    }
    return this.sessions.save(
      this.sessions.create({
        userId,
        warehouseId: dto.warehouseId ?? null,
        openingAmount: String(dto.openingAmount),
        status: CashSessionStatus.OPEN,
        openedAt: new Date(),
      }),
    );
  }

  async close(userId: string, dto: CloseCashDto): Promise<CashSession> {
    const session = await this.requireOpenSession(userId);
    const expected = await this.computeExpected(session);
    session.expectedAmount = String(expected);
    session.countedAmount = String(dto.countedAmount);
    session.difference = String(dto.countedAmount - expected);
    session.status = CashSessionStatus.CLOSED;
    session.closedAt = new Date();
    return this.sessions.save(session);
  }

  async listMovements(sessionId: string): Promise<CashMovement[]> {
    return this.movements.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async addManualMovement(
    userId: string,
    type: CashMovementType,
    dto: CashMovementDto,
  ): Promise<CashMovement> {
    const session = await this.requireOpenSession(userId);
    return this.recordMovement(
      session.id,
      type,
      dto.amount,
      dto.concept,
      'manual',
    );
  }

  /** Registra un movimiento; usable dentro de una transacción externa. */
  async recordMovement(
    sessionId: string,
    type: CashMovementType,
    amount: number,
    concept: string,
    refType?: string,
    refId?: string,
    manager?: EntityManager,
  ): Promise<CashMovement> {
    const repo = manager
      ? manager.getRepository(CashMovement)
      : this.movements;
    return repo.save(
      repo.create({
        sessionId,
        type,
        amount: String(amount),
        concept,
        refType,
        refId,
      }),
    );
  }

  async findOne(id: string): Promise<CashSession> {
    const session = await this.sessions.findOne({
      where: { id },
      relations: { movements: true },
    });
    if (!session) throw new NotFoundException('Sesión de caja no encontrada');
    return session;
  }

  private async computeExpected(session: CashSession): Promise<number> {
    const movements = await this.movements.find({
      where: { sessionId: session.id },
    });
    return movements.reduce(
      (acc, m) =>
        m.type === CashMovementType.IN
          ? acc + Number(m.amount)
          : acc - Number(m.amount),
      Number(session.openingAmount),
    );
  }
}
