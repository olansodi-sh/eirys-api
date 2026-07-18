import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThirdParty } from './entities/third-party.entity';
import { ThirdPartiesService } from './third-parties.service';
import { ThirdPartiesController } from './third-parties.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ThirdParty])],
  controllers: [ThirdPartiesController],
  providers: [ThirdPartiesService],
  exports: [ThirdPartiesService],
})
export class ThirdPartiesModule {}
