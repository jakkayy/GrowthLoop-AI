import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ContentService } from '../content/content.service';
import { LineService } from '../line/line.service';
import { DraftsService } from '../drafts/drafts.service';
import { CONTENT_GENERATION_QUEUE } from '../queue/queue.constants';

export type ContentGenerationJobData = {
  userId: string;
  lineUserId: string;
};

/**
 * Runs "generate content → push to LINE for approval → mark sent" as a
 * retryable background job instead of inline in the cron tick. BullMQ
 * retries a failed job automatically with backoff (see QueueModule) —
 * a transient OpenRouter or LINE API failure no longer means the user
 * gets nothing until tomorrow.
 *
 * Known limitation: a retry re-runs all three steps, including
 * generation. If the LINE push fails after a successful (and
 * already-paid-for) generation, the retry generates again. Splitting
 * this into separately-resumable steps is future work; this is still a
 * clear improvement over the previous "one attempt ever, per day"
 * behavior.
 */
@Processor(CONTENT_GENERATION_QUEUE)
export class ContentGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ContentGenerationProcessor.name);

  constructor(
    private readonly contentService: ContentService,
    private readonly lineService: LineService,
    private readonly draftsService: DraftsService,
  ) {
    super();
  }

  async process(job: Job<ContentGenerationJobData>): Promise<void> {
    const { userId, lineUserId } = job.data;

    const { draftId, caption, imageUrl } =
      await this.contentService.generateAndSave({ userId, lineUserId });
    this.logger.log(
      `Generated draft ${draftId} for user ${userId} (attempt ${job.attemptsMade + 1})`,
    );

    await this.lineService.pushReviewFlex({
      to: lineUserId,
      draftId,
      caption,
      imageUrl,
    });
    await this.draftsService.markSent(draftId);
    this.logger.log(`Sent draft ${draftId} to LINE`);
  }
}
