import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreditNotesService } from './credit-notes.service';
import { CreateCreditNoteDto } from './dto/credit-note.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../roles/permissions.catalog';

@ApiTags('credit-notes')
@ApiBearerAuth()
@Controller('credit-notes')
export class CreditNotesController {
  constructor(private readonly service: CreditNotesService) {}

  @RequirePermissions(PERMISSIONS.CREDIT_NOTES_WRITE)
  @Post()
  create(@Body() dto: CreateCreditNoteDto) {
    return this.service.create(dto);
  }

  @RequirePermissions(PERMISSIONS.SALES_READ)
  @Get()
  findAll() {
    return this.service.findAll();
  }
}
