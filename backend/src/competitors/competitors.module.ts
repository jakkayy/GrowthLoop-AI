import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CompetitorsController } from './competitors.controller';
import { CompetitorsService } from './competitors.service';
import { CompetitorScrapeProcessor } from './competitor-scrape.processor';
import { ApifyService } from './apify.service';
import { AiModule } from '../ai/ai.module';
import { COMPETITOR_SCRAPE_QUEUE } from '../queue/queue.constants';

@Module({
  imports: [
    AiModule,
    BullModule.registerQueue({ name: COMPETITOR_SCRAPE_QUEUE }),
  ],
  controllers: [CompetitorsController],
  providers: [CompetitorsService, ApifyService, CompetitorScrapeProcessor],
  exports: [CompetitorsService],
})
export class CompetitorsModule {}
