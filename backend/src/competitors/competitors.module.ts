import { Module } from '@nestjs/common';
import { CompetitorsController } from './competitors.controller';
import { CompetitorsService } from './competitors.service';
import { ApifyService } from './apify.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [CompetitorsController],
  providers: [CompetitorsService, ApifyService],
  exports: [CompetitorsService],
})
export class CompetitorsModule {}
