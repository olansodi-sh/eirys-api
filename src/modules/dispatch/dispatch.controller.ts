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
import { DispatchService } from './dispatch.service';
import { CreateDispatchDto } from './dto/dispatch.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../roles/permissions.catalog';

@ApiTags('dispatch')
@ApiBearerAuth()
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly service: DispatchService) {}

  @RequirePermissions(PERMISSIONS.DISPATCH_WRITE)
  @Post()
  create(@Body() dto: CreateDispatchDto) {
    return this.service.create(dto);
  }

  @RequirePermissions(PERMISSIONS.DISPATCH_READ)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @RequirePermissions(PERMISSIONS.DISPATCH_WRITE)
  @Patch(':id/done')
  markDone(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.markDone(id);
  }
}
