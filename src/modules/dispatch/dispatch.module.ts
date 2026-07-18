import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispatch } from './entities/dispatch.entity';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Dispatch])],
  controllers: [DispatchController],
  providers: [DispatchService],
})
export class DispatchModule {}
