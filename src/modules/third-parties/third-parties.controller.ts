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
import { ThirdPartiesService } from './third-parties.service';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';
import { ThirdPartyType } from './entities/third-party.entity';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../roles/permissions.catalog';

@ApiTags('third-parties')
@ApiBearerAuth()
@Controller('third-parties')
export class ThirdPartiesController {
  constructor(private readonly service: ThirdPartiesService) {}

  @RequirePermissions(PERMISSIONS.THIRD_PARTIES_WRITE)
  @Post()
  create(@Body() dto: CreateThirdPartyDto) {
    return this.service.create(dto);
  }

  @RequirePermissions(PERMISSIONS.THIRD_PARTIES_READ)
  @Get()
  findAll(
    @Query('type') type?: ThirdPartyType,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(type, search);
  }

  @RequirePermissions(PERMISSIONS.THIRD_PARTIES_READ)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @RequirePermissions(PERMISSIONS.THIRD_PARTIES_WRITE)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateThirdPartyDto,
  ) {
    return this.service.update(id, dto);
  }

  @RequirePermissions(PERMISSIONS.THIRD_PARTIES_WRITE)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
