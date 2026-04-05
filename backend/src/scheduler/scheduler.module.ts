import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ContentModule } from '../content/content.module';
import { LineModule } from '../line/line.module';
import { DraftsModule } from '../drafts/drafts.module';
import { FacebookPostModule } from '../facebook/facebook-post.module';
import { CompetitorsModule } from '../competitors/competitors.module';

@Module({
  imports: [ContentModule, LineModule, DraftsModule, FacebookPostModule, CompetitorsModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
