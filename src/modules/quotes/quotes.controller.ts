import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { ConvertQuoteDto, CreateQuoteDto } from './dto/quote.dto';
import { QuoteStatus } from './entities/quote.entity';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../roles/permissions.catalog';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('quotes')
@ApiBearerAuth()
@Controller('quotes')
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  @RequirePermissions(PERMISSIONS.QUOTES_WRITE)
  @Post()
  create(@Body() dto: CreateQuoteDto) {
    return this.service.create(dto);
  }

  @RequirePermissions(PERMISSIONS.QUOTES_READ)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @RequirePermissions(PERMISSIONS.QUOTES_READ)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @RequirePermissions(PERMISSIONS.QUOTES_WRITE)
  @Patch(':id/status')
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: QuoteStatus,
  ) {
    return this.service.setStatus(id, status);
  }

  @RequirePermissions(PERMISSIONS.SALES_WRITE)
  @Post(':id/convert')
  convert(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ConvertQuoteDto,
  ) {
    return this.service.convert(id, user.id, dto);
  }
}
