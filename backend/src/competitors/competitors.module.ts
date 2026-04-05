import { Module } from '@nestjs/common';
import { CompetitorsController } from './competitors.controller';
import { CompetitorsService } from './competitors.service';
import { ApifyService } from './apify.service';

@Module({
  controllers: [CompetitorsController],
  providers: [CompetitorsService, ApifyService],
  exports: [CompetitorsService],
})
export class CompetitorsModule {}
