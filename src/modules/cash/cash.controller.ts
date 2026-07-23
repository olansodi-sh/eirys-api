import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CashService } from './cash.service';
import { CashMovementDto, CloseCashDto, OpenCashDto } from './dto/cash.dto';
import { CashMovementType } from './entities/cash-movement.entity';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../roles/permissions.catalog';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('cash')
@ApiBearerAuth()
@RequirePermissions(PERMISSIONS.CASH_MANAGE)
@Controller('cash')
export class CashController {
  constructor(private readonly service: CashService) {}

  @Get('current')
  current(@CurrentUser() user: AuthUser) {
    return this.service.getOpenSession(user.id);
  }

  @Post('open')
  open(@CurrentUser() user: AuthUser, @Body() dto: OpenCashDto) {
    return this.service.open(user.id, dto);
  }

  @Post('close')
  close(@CurrentUser() user: AuthUser, @Body() dto: CloseCashDto) {
    return this.service.close(user.id, dto);
  }

  @Post('movements/in')
  addIn(@CurrentUser() user: AuthUser, @Body() dto: CashMovementDto) {
    return this.service.addManualMovement(user.id, CashMovementType.IN, dto);
  }

  @Post('movements/out')
  addOut(@CurrentUser() user: AuthUser, @Body() dto: CashMovementDto) {
    return this.service.addManualMovement(user.id, CashMovementType.OUT, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/movements')
  movements(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listMovements(id);
  }
}
