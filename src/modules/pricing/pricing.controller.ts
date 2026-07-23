import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import {
  CreatePriceListDto,
  SetPricesDto,
  UpdatePriceListDto,
} from './dto/pricing.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../roles/permissions.catalog';

@ApiTags('pricing')
@ApiBearerAuth()
@Controller('pricing/price-lists')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @RequirePermissions(PERMISSIONS.PRICING_WRITE)
  @Post()
  create(@Body() dto: CreatePriceListDto) {
    return this.service.create(dto);
  }

  @RequirePermissions(PERMISSIONS.PRICING_READ)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @RequirePermissions(PERMISSIONS.PRICING_READ)
  @Get('price')
  getPrice(
    @Query('variantId', ParseUUIDPipe) variantId: string,
    @Query('priceListId') priceListId?: string,
  ) {
    return this.service
      .getPrice(variantId, priceListId)
      .then((price) => ({ variantId, price }));
  }

  @RequirePermissions(PERMISSIONS.PRICING_READ)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @RequirePermissions(PERMISSIONS.PRICING_WRITE)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePriceListDto,
  ) {
    return this.service.update(id, dto);
  }

  @RequirePermissions(PERMISSIONS.PRICING_WRITE)
  @Post(':id/prices')
  setPrices(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPricesDto,
  ) {
    return this.service.setPrices(id, dto);
  }

  @RequirePermissions(PERMISSIONS.PRICING_WRITE)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
