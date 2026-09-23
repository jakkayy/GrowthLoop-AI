import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FacebookPostService } from '../facebook/facebook-post.service';
import { DraftsService } from '../drafts/drafts.service';
import { FACEBOOK_POST_QUEUE } from '../queue/queue.constants';

export type FacebookPostJobData = {
  draftId: string;
  userId: string;
  caption: string;
  imageUrl: string;
};

/**
 * Posts an approved draft to Facebook as a retryable background job.
 * The draft is already claimed (status flipped to 'posted') before this
 * job is enqueued — see SchedulerService.postBySchedule — so a retry
 * here only re-attempts the actual Graph API call, not the claim.
 */
@Processor(FACEBOOK_POST_QUEUE)
export class FacebookPostProcessor extends WorkerHost {
  private readonly logger = new Logger(FacebookPostProcessor.name);

  constructor(
    private readonly facebookPostService: FacebookPostService,
    private readonly draftsService: DraftsService,
  ) {
    super();
  }

  async process(job: Job<FacebookPostJobData>): Promise<void> {
    const { draftId, userId, caption, imageUrl } = job.data;

    const postId = await this.facebookPostService.postToPages({
      userId,
      caption,
      imageUrl,
    });
    if (postId) {
      await this.draftsService.savePostId(draftId, postId);
    }
    this.logger.log(`Draft ${draftId} posted successfully`);
  }
}
