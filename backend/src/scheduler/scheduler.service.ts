import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ContentService } from '../content/content.service';
import { LineService } from '../line/line.service';
import { DraftsService } from '../drafts/drafts.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly contentService: ContentService,
    private readonly lineService: LineService,
    private readonly draftsService: DraftsService,
  ) {}

  // ทุกวัน 06:00 — generate content สำหรับ user ทุกคน
  // @Cron('0 6 * * *')
  @Cron('35 19 * * *')
  async generateDailyContent() {
    this.logger.log('=== [06:00] Generating daily content ===');
    const users = await this.draftsService.getAllActiveUsers();
    this.logger.log(`Found ${users.length} active users`);

    for (const user of users) {
      try {
        await this.contentService.generateAndSave({
          userId: user.user_id,
          lineUserId: user.line_user_id,
        });
        this.logger.log(`Generated draft for user ${user.user_id}`);
      } catch (err) {
        this.logger.error(
          `Failed to generate for user ${user.user_id}: ${err}`,
        );
      }
    }
  }

  // ทุกวัน 08:00 — ส่ง flex message หาทุก draft ที่ยังไม่ได้ส่ง
  // @Cron('0 8 * * *')
  @Cron('40 19 * * *')
  async sendPendingDrafts() {
    this.logger.log('=== [08:00] Sending pending drafts ===');
    const drafts = await this.draftsService.getPendingUnsent();
    this.logger.log(`Found ${drafts.length} unsent drafts`);

    for (const draft of drafts) {
      try {
        await this.lineService.pushReviewFlex({
          to: draft.line_user_id,
          draftId: draft.id,
          caption: draft.caption,
          imageUrl: draft.image_url,
        });
        await this.draftsService.markSent(draft.id);
        this.logger.log(`Sent draft ${draft.id}`);
      } catch (err) {
        this.logger.error(`Failed to send draft ${draft.id}: ${err}`);
      }
    }
  }

  // ทุก 5 นาที — expire draft ที่เลยเวลา 2 ชม. แล้ว
  @Cron('*/10 * * * *')
  async expireOverdueDrafts() {
    await this.draftsService.expireOverdue();
  }
}
