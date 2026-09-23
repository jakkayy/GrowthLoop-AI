import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ContentService } from '../content/content.service';
import { LineService } from '../line/line.service';
import { DraftsService } from '../drafts/drafts.service';
import { FacebookPostService } from '../facebook/facebook-post.service';
import { EngagementReportService } from '../facebook/engagement-report.service';
import { CompetitorsService } from '../competitors/competitors.service';

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
    private readonly contentService: ContentService,
    private readonly lineService: LineService,
    private readonly draftsService: DraftsService,
    private readonly facebookPostService: FacebookPostService,
    private readonly engagementReportService: EngagementReportService,
    private readonly competitorsService: CompetitorsService,
  ) {}

  // ทุก 1 นาที — เช็ค user ที่ถึงเวลา generate (และยังไม่ได้ generate วันนี้)
  // แล้วส่ง LINE ให้อนุมัติ
  @Cron('* * * * *')
  async generateAndSendBySchedule() {
    const now = currentHHMM();
    const today = todayInBangkok();
    const pending =
      await this.draftsService.getUsersPendingGenerationToday(today);
    const targets = pending.filter((u) => u.generate_time <= now);
    if (targets.length === 0) return;

    this.logger.log(
      `[${now}] Generating content for ${targets.length} user(s)`,
    );

    for (const user of targets) {
      // Claim today's slot atomically first — if another instance (or an
      // overlapping tick) already claimed it, skip. Not undone on failure
      // below: a hard failure retries tomorrow, not this same minute.
      const claimed = await this.draftsService.claimGeneration(
        user.user_id,
        today,
      );
      if (!claimed) continue;

      try {
        const { draftId, caption, imageUrl } =
          await this.contentService.generateAndSave({
            userId: user.user_id,
            lineUserId: user.line_user_id,
          });

        this.logger.log(`Generated draft ${draftId} for user ${user.user_id}`);

        await this.lineService.pushReviewFlex({
          to: user.line_user_id,
          draftId,
          caption,
          imageUrl,
        });
        await this.draftsService.markSent(draftId);
        this.logger.log(`Sent draft ${draftId} to LINE`);
      } catch (err) {
        this.logger.error(`Failed for user ${user.user_id}: ${String(err)}`);
      }
    }
  }

  // ทุก 1 นาที — เช็ค user ที่ถึงเวลา post แล้วโพสต์ Facebook
  @Cron('* * * * *')
  async postBySchedule() {
    const now = currentHHMM();
    const drafts = await this.draftsService.getApprovedWithSchedule();
    const targets = drafts.filter((d) => d.post_time <= now);
    if (targets.length === 0) return;

    this.logger.log(
      `[${now}] Posting ${targets.length} approved draft(s) to Facebook`,
    );

    for (const draft of targets) {
      try {
        const claimed = await this.draftsService.claimForPosting(draft.id);
        if (!claimed) continue; // อีก instance claim ไปก่อนแล้ว

        const postId = await this.facebookPostService.postToPages({
          userId: draft.user_id,
          caption: draft.caption,
          imageUrl: draft.image_url,
        });
        if (postId) {
          await this.draftsService.savePostId(draft.id, postId);
        }
        this.logger.log(`Draft ${draft.id} posted successfully`);
      } catch (err) {
        this.logger.error(`Failed to post draft ${draft.id}: ${String(err)}`);
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
