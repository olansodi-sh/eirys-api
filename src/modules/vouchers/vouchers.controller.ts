import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, RedeemVoucherDto } from './dto/voucher.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../roles/permissions.catalog';

@ApiTags('vouchers')
@ApiBearerAuth()
@RequirePermissions(PERMISSIONS.VOUCHERS_MANAGE)
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly service: VouchersService) {}

  @Post()
  create(@Body() dto: CreateVoucherDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':code')
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Post(':code/redeem')
  redeem(@Param('code') code: string, @Body() dto: RedeemVoucherDto) {
    return this.service.redeem(code, dto);
  }
}
