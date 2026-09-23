import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { QueueModule } from './queue/queue.module';
import { AiModule } from './ai/ai.module';
import { LineModule } from './line/line.module';
import { ContentModule } from './content/content.module';
import { StorageModule } from './storage/storage.module';
import { DraftsModule } from './drafts/drafts.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { CompetitorsModule } from './competitors/competitors.module';
import { FacebookPostModule } from './facebook/facebook-post.module';
import { TestController } from './test.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    QueueModule,
    AiModule,
    LineModule,
    ContentModule,
    StorageModule,
    DraftsModule,
    SchedulerModule,
    CompetitorsModule,
    FacebookPostModule,
  ],
  controllers: [TestController],
})
export class AppModule {}
