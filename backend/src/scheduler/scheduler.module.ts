import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ContentModule } from '../content/content.module';
import { LineModule } from '../line/line.module';
import { DraftsModule } from '../drafts/drafts.module';

@Module({
  imports: [ContentModule, LineModule, DraftsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
