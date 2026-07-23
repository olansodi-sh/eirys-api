import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DebitNotesService } from '../services/debit-notes.service';
import { CreateDebitNoteDto } from '../dto/debit-note.dto';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../roles/permissions.catalog';

@ApiTags('purchases/debit-notes')
@ApiBearerAuth()
@Controller('purchases/debit-notes')
export class DebitNotesController {
  constructor(private readonly service: DebitNotesService) {}

  @RequirePermissions(PERMISSIONS.PURCHASES_WRITE)
  @Post()
  create(@Body() dto: CreateDebitNoteDto) {
    return this.service.create(dto);
  }

  @RequirePermissions(PERMISSIONS.PURCHASES_READ)
  @Get()
  findAll() {
    return this.service.findAll();
  }
}
