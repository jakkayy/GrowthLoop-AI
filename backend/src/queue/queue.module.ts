import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Sets up the single Redis/Valkey connection shared by every BullMQ queue
 * in the app (registered once here per @nestjs/bullmq's docs; feature
 * modules then call BullModule.registerQueue({ name }) to get an
 * injectable Queue for that connection — see CompetitorsModule and
 * SchedulerModule).
 *
 * Sprint 2, item 2.3: AI generation, image generation, competitor
 * scraping and Facebook posting used to run inline in a cron tick (or,
 * for scraping, fire-and-forget with no retry at all) — one transient
 * failure meant no retry until the next scheduled run, if ever. Moving
 * them onto a real queue gives every job automatic retry with backoff.
 *
 * Requires REDIS_URL to be set for anything beyond local dev (defaults
 * to localhost so `npm run start:dev` works out of the box without extra
 * setup). Works with either Redis or Valkey — BullMQ only needs the
 * Redis wire protocol, which Valkey implements.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') || 'redis://localhost:6379',
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 2000 },
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
