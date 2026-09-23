import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DraftsService } from '../drafts/drafts.service';
import { EngagementReportService } from '../facebook/engagement-report.service';
import { CompetitorsService } from '../competitors/competitors.service';
import {
  CONTENT_GENERATION_QUEUE,
  FACEBOOK_POST_QUEUE,
} from '../queue/queue.constants';
import type { ContentGenerationJobData } from './content-generation.processor';
import type { FacebookPostJobData } from './facebook-post.processor';

function currentHHMM(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}

// "YYYY-MM-DD" in Asia/Bangkok — the calendar date used to decide whether
// a daily job has already run today, independent of server/UTC timezone.
function todayInBangkok(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
  });
  return formatter.format(now);
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly draftsService: DraftsService,
    private readonly engagementReportService: EngagementReportService,
    private readonly competitorsService: CompetitorsService,
    @InjectQueue(CONTENT_GENERATION_QUEUE)
    private readonly contentGenerationQueue: Queue<ContentGenerationJobData>,
    @InjectQueue(FACEBOOK_POST_QUEUE)
    private readonly facebookPostQueue: Queue<FacebookPostJobData>,
  ) {}

  // ทุก 1 นาที — เช็ค user ที่ถึงเวลา generate (และยังไม่ได้ generate วันนี้)
  // แล้ว enqueue งาน generate+ส่ง LINE (ทำจริงใน ContentGenerationProcessor
  // ซึ่งมี retry/backoff ให้อัตโนมัติ)
  @Cron('* * * * *')
  async generateAndSendBySchedule() {
    const now = currentHHMM();
    const today = todayInBangkok();
    const pending =
      await this.draftsService.getUsersPendingGenerationToday(today);
    const targets = pending.filter((u) => u.generate_time <= now);
    if (targets.length === 0) return;

    this.logger.log(
      `[${now}] Queuing content generation for ${targets.length} user(s)`,
    );

    for (const user of targets) {
      // Claim today's slot atomically first — if another instance (or an
      // overlapping tick) already claimed it, skip. Not undone on failure
      // below: retrying the job itself is the queue's job now, but a claim
      // that never even got enqueued (e.g. Redis briefly unreachable)
      // retries tomorrow, not this same minute.
      const claimed = await this.draftsService.claimGeneration(
        user.user_id,
        today,
      );
      if (!claimed) continue;

      try {
        await this.contentGenerationQueue.add('generate', {
          userId: user.user_id,
          lineUserId: user.line_user_id,
        });
        this.logger.log(`Queued generation for user ${user.user_id}`);
      } catch (err) {
        this.logger.error(
          `Failed to queue generation for user ${user.user_id}: ${String(err)}`,
        );
      }
    }
  }

  // ทุก 1 นาที — เช็ค user ที่ถึงเวลา post แล้ว enqueue งานโพสต์ Facebook
  // (ทำจริงใน FacebookPostProcessor ซึ่งมี retry/backoff ให้อัตโนมัติ)
  @Cron('* * * * *')
  async postBySchedule() {
    const now = currentHHMM();
    const drafts = await this.draftsService.getApprovedWithSchedule();
    const targets = drafts.filter((d) => d.post_time <= now);
    if (targets.length === 0) return;

    this.logger.log(
      `[${now}] Queuing ${targets.length} approved draft(s) for Facebook posting`,
    );

    for (const draft of targets) {
      try {
        const claimed = await this.draftsService.claimForPosting(draft.id);
        if (!claimed) continue; // อีก instance claim ไปก่อนแล้ว

        await this.facebookPostQueue.add('post', {
          draftId: draft.id,
          userId: draft.user_id,
          caption: draft.caption,
          imageUrl: draft.image_url,
        });
        this.logger.log(`Queued draft ${draft.id} for posting`);
      } catch (err) {
        this.logger.error(
          `Failed to queue draft ${draft.id} for posting: ${String(err)}`,
        );
      }
    }
  }

  // ทุก 5 นาที — expire draft ที่เลยเวลา 2 ชม. แล้ว
  @Cron('*/5 * * * *')
  async expireOverdueDrafts() {
    await this.draftsService.expireOverdue();
  }

  // ทุก 1 นาที — ส่งรายงาน engagement รายวันให้ user ที่ถึงเวลา report_time
  // (และยังไม่ได้ส่งวันนี้)
  @Cron('* * * * *')
  async sendDailyReportBySchedule() {
    const now = currentHHMM();
    const today = todayInBangkok();
    const pending = await this.draftsService.getUsersPendingReportToday(today);
    const targets = pending.filter((u) => u.report_time <= now);
    if (targets.length === 0) return;

    this.logger.log(
      `[${now}] Sending engagement report for ${targets.length} user(s)`,
    );

    for (const user of targets) {
      const claimed = await this.draftsService.claimReport(user.user_id, today);
      if (!claimed) continue;

      try {
        await this.engagementReportService.sendDailyReport(
          user.user_id,
          user.line_user_id,
        );
      } catch (err) {
        this.logger.error(
          `Failed to send report for user ${user.user_id}: ${String(err)}`,
        );
      }
    }
  }

  // ทุกจันทร์ 08:00 (Asia/Bangkok) — scrape คู่แข่งอัตโนมัติรายสัปดาห์
  @Cron('0 8 * * 1', { timeZone: 'Asia/Bangkok' })
  async weeklyCompetitorScrape() {
    this.logger.log('[Weekly] Starting competitor scrape');
    await this.competitorsService.scrapeAllUsers();
  }
}
