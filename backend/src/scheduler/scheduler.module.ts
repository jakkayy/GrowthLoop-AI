import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SchedulerService } from './scheduler.service';
import { ContentGenerationProcessor } from './content-generation.processor';
import { FacebookPostProcessor } from './facebook-post.processor';
import { ContentModule } from '../content/content.module';
import { LineModule } from '../line/line.module';
import { DraftsModule } from '../drafts/drafts.module';
import { FacebookPostModule } from '../facebook/facebook-post.module';
import { CompetitorsModule } from '../competitors/competitors.module';
import {
  CONTENT_GENERATION_QUEUE,
  FACEBOOK_POST_QUEUE,
} from '../queue/queue.constants';

@Module({
  imports: [
    ContentModule,
    LineModule,
    DraftsModule,
    FacebookPostModule,
    CompetitorsModule,
    BullModule.registerQueue(
      { name: CONTENT_GENERATION_QUEUE },
      { name: FACEBOOK_POST_QUEUE },
    ),
  ],
  providers: [
    SchedulerService,
    ContentGenerationProcessor,
    FacebookPostProcessor,
  ],
  exports: [SchedulerService],
})
export class SchedulerModule {}
