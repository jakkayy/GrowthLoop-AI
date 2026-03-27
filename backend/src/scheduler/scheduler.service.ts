import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ContentService } from '../content/content.service';
import { LineService } from '../line/line.service';
import { DraftsService } from '../drafts/drafts.service';
import { FacebookPostService } from '../facebook/facebook-post.service';

function currentHHMM(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly contentService: ContentService,
    private readonly lineService: LineService,
    private readonly draftsService: DraftsService,
    private readonly facebookPostService: FacebookPostService,
  ) {}

  // ทุก 1 นาที — เช็ค user ที่ถึงเวลา generate แล้วส่ง LINE ให้อนุมัติ
  @Cron('* * * * *')
  async generateAndSendBySchedule() {
    const now = currentHHMM();
    const users = await this.draftsService.getAllActiveUsers();
    const targets = users.filter((u) => u.generate_time === now);
    if (targets.length === 0) return;

    this.logger.log(
      `[${now}] Generating content for ${targets.length} user(s)`,
    );

    for (const user of targets) {
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
    const targets = drafts.filter((d) => d.post_time === now);
    if (targets.length === 0) return;

    this.logger.log(
      `[${now}] Posting ${targets.length} approved draft(s) to Facebook`,
    );

    for (const draft of targets) {
      try {
        await this.facebookPostService.postToPages({
          userId: draft.user_id,
          caption: draft.caption,
          imageUrl: draft.image_url,
        });
        await this.draftsService.markPosted(draft.id);
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
}
