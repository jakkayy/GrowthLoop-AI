import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CompetitorsService } from './competitors.service';
import { COMPETITOR_SCRAPE_QUEUE } from '../queue/queue.constants';

export type CompetitorScrapeJobData = {
  jobId: string;
  competitorId: string;
  pageUrl: string;
  userId: string;
};

/**
 * Runs a competitor scrape (Apify + AI summarization) as a retryable
 * background job. Previously this ran fire-and-forget straight from the
 * controller/weekly cron with no retry at all — a transient Apify
 * timeout meant that week's scrape for that competitor just never
 * happened, with only a log line to show for it.
 */
@Processor(COMPETITOR_SCRAPE_QUEUE)
export class CompetitorScrapeProcessor extends WorkerHost {
  private readonly logger = new Logger(CompetitorScrapeProcessor.name);

  constructor(private readonly competitorsService: CompetitorsService) {
    super();
  }

  async process(job: Job<CompetitorScrapeJobData>): Promise<void> {
    const { jobId, competitorId, pageUrl, userId } = job.data;
    await this.competitorsService.runScrape(
      jobId,
      competitorId,
      pageUrl,
      userId,
    );
  }

  // Only mark the DB row 'failed' once BullMQ has exhausted every retry —
  // an attempt failing partway through doesn't mean the job is dead yet,
  // and marking it failed too early would misinform anyone watching the
  // competitor_scrape_jobs table (e.g. the dashboard's job status list).
  @OnWorkerEvent('failed')
  async onFailed(job: Job<CompetitorScrapeJobData> | undefined, error: Error) {
    if (!job) return;
    const attemptsExhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (!attemptsExhausted) return;

    this.logger.error(
      `Scrape job ${job.data.jobId} failed after ${job.attemptsMade} attempt(s): ${error?.message}`,
    );
    await this.competitorsService.failJob(
      job.data.jobId,
      error?.message ?? String(error),
    );
  }
}
