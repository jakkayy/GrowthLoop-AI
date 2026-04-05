import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const APIFY_BASE = 'https://api.apify.com/v2';
const POLL_INTERVAL_MS = 6000;
const MAX_WAIT_MS = 10 * 60 * 1000; // 10 minutes

export interface ApifyPost {
  postId: string;
  url: string;
  text: string;
  time: string; // ISO string
  likes: number;
  comments: number;
  shares: number;
}

export interface ApifyComment {
  id: string;
  commentId: string;
  facebookUrl: string; // URL of the parent post
  text: string;
  profileName: string;
  date: string; // ISO string
  likesCount: number;
}

@Injectable()
export class ApifyService {
  private readonly logger = new Logger(ApifyService.name);
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('APIFY_API_KEY') || '';
  }

  private get headers() {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  private async postWithRetry(
    url: string,
    body: unknown,
    retries = 3,
  ): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data } = await axios.post(url, body, {
          headers: this.headers,
        });
        return data;
      } catch (err: any) {
        const status = err?.response?.status;
        this.logger.warn(
          `Apify POST attempt ${attempt}/${retries} failed (${status ?? err?.message})`,
        );
        if (attempt === retries) throw err;
        await this.sleep(3000 * attempt);
      }
    }
  }

  async runFacebookPostsScraper(pageUrl: string): Promise<string> {
    const actorId = 'apify~facebook-posts-scraper';
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]; // "YYYY-MM-DD"

    const data = await this.postWithRetry(
      `${APIFY_BASE}/acts/${actorId}/runs`,
      {
        startUrls: [{ url: pageUrl }],
        resultsLimit: 5,
        commentsMode: 'NONE',
        onlyPostsNewerThan: sevenDaysAgo,
      },
    );
    return data.data.id as string;
  }

  async runFacebookCommentsScraper(postUrls: string[]): Promise<string> {
    const actorId = 'apify~facebook-comments-scraper';
    const data = await this.postWithRetry(
      `${APIFY_BASE}/acts/${actorId}/runs`,
      {
        startUrls: postUrls.map((url) => ({ url })),
        resultsLimit: 10,
      },
    );
    return data.data.id as string;
  }

  async pollUntilDone(runId: string): Promise<string> {
    const start = Date.now();
    while (Date.now() - start < MAX_WAIT_MS) {
      const { data } = await axios.get(
        `${APIFY_BASE}/actor-runs/${runId}`,
        { headers: this.headers },
      );
      const { status, defaultDatasetId } = data.data;
      if (['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED'].includes(status)) {
        if (status !== 'SUCCEEDED') {
          throw new Error(`Apify run ${runId} ended with status: ${status}`);
        }
        return defaultDatasetId as string;
      }
      await this.sleep(POLL_INTERVAL_MS);
    }
    throw new Error(`Apify run ${runId} timed out after ${MAX_WAIT_MS}ms`);
  }

  async fetchDataset<T>(datasetId: string): Promise<T[]> {
    const { data } = await axios.get(
      `${APIFY_BASE}/datasets/${datasetId}/items?format=json&clean=true`,
      { headers: this.headers },
    );
    return (data as T[]) ?? [];
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
