import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ApifyService, ApifyPost, ApifyComment } from './apify.service';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface GroupedPost {
  post_id: string;
  post_url: string;
  text: string;
  created_time: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  comments: {
    comment_id: string;
    text: string;
    author_name: string;
    likes_count: number;
    created_time: string;
  }[];
}

export interface ScrapeResult {
  competitor_id: string;
  page_url: string;
  scraped_at: string;
  period: 'last_7_days';
  posts: GroupedPost[];
}

@Injectable()
export class CompetitorsService {
  private readonly logger = new Logger(CompetitorsService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(
    private readonly config: ConfigService,
    private readonly apify: ApifyService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.bucket =
      this.config.get<string>('SUPABASE_STORAGE_BUCKET') || 'image-post';
  }

  // ─── Competitor CRUD ───────────────────────────────────────────────

  async addCompetitor(input: {
    userId: string;
    pageUrl: string;
    pageName: string;
  }): Promise<string> {
    const { data, error } = await this.supabase
      .from('competitors')
      .insert({
        user_id: input.userId,
        page_url: input.pageUrl,
        page_name: input.pageName,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data.id as string;
  }

  async getCompetitors(userId: string) {
    const { data, error } = await this.supabase
      .from('competitors')
      .select(
        'id, page_url, page_name, created_at, competitor_scrape_jobs(id, status, posts_count, result_url, started_at, completed_at)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async deleteCompetitor(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('competitors')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  // ─── Scraping ──────────────────────────────────────────────────────

  async createScrapeJob(competitorId: string, userId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('competitor_scrape_jobs')
      .insert({
        competitor_id: competitorId,
        user_id: userId,
        status: 'running',
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data.id as string;
  }

  triggerScrape(
    jobId: string,
    competitorId: string,
    pageUrl: string,
  ): void {
    this.runScrape(jobId, competitorId, pageUrl).catch((err) => {
      this.logger.error(`Scrape job ${jobId} failed: ${String(err)}`);
      this.failJob(jobId, String(err)).catch(() => {});
    });
  }

  private async runScrape(
    jobId: string,
    competitorId: string,
    pageUrl: string,
  ): Promise<void> {
    this.logger.log(`[Job ${jobId}] Starting posts scrape for ${pageUrl}`);

    // 1. Run posts scraper
    const postsRunId = await this.apify.runFacebookPostsScraper(pageUrl);
    const postsDatasetId = await this.apify.pollUntilDone(postsRunId);
    const rawPosts = await this.apify.fetchDataset<ApifyPost>(postsDatasetId);

    // 2. Filter to last 7 days
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
    const recentPosts = rawPosts.filter(
      (p) => p.time && new Date(p.time) >= cutoff,
    );

    this.logger.log(
      `[Job ${jobId}] Found ${recentPosts.length} posts in last 7 days`,
    );

    let groupedPosts: GroupedPost[] = recentPosts.map((p) => ({
      post_id: p.postId,
      post_url: p.url,
      text: p.text || '',
      created_time: p.time,
      likes_count: p.likes || 0,
      comments_count: p.comments || 0,
      shares_count: p.shares || 0,
      comments: [],
    }));

    // 3. Run comments scraper (single run for all posts)
    if (recentPosts.length > 0) {
      const postUrls = recentPosts.map((p) => p.url).filter(Boolean);
      this.logger.log(`[Job ${jobId}] Fetching comments for ${postUrls.length} posts`);
      const commentsRunId =
        await this.apify.runFacebookCommentsScraper(postUrls);
      const commentsDatasetId = await this.apify.pollUntilDone(commentsRunId);
      const rawComments =
        await this.apify.fetchDataset<ApifyComment>(commentsDatasetId);

      // 4. Group comments by post URL
      const normalizeUrl = (url: string) =>
        url?.replace(/^https?:\/\/(www\.|web\.)?facebook\.com/, '').split('?')[0];

      const commentsByPost = new Map<string, ApifyComment[]>();
      for (const c of rawComments) {
        const rawField = c.facebookUrl ?? '';
        if (!rawField) continue;
        const key = normalizeUrl(rawField);
        const arr = commentsByPost.get(key) ?? [];
        arr.push(c);
        commentsByPost.set(key, arr);
      }

      groupedPosts = groupedPosts.map((post) => ({
        ...post,
        comments: (commentsByPost.get(normalizeUrl(post.post_url)) ?? []).map((c) => ({
          comment_id: c.commentId || c.id,
          text: c.text || '',
          author_name: c.profileName || '',
          likes_count: c.likesCount || 0,
          created_time: c.date,
        })),
      }));
    }

    // 5. Build result JSON
    const result: ScrapeResult = {
      competitor_id: competitorId,
      page_url: pageUrl,
      scraped_at: new Date().toISOString(),
      period: 'last_7_days',
      posts: groupedPosts,
    };

    // 6. Upload JSON to Supabase Storage
    const filePath = `competitor-results/${jobId}.json`;
    const jsonBuffer = Buffer.from(JSON.stringify(result, null, 2), 'utf-8');
    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(filePath, jsonBuffer, {
        contentType: 'application/json',
        upsert: true,
        cacheControl: '3600',
      });
    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath);

    // 7. Save posts & comments to DB
    if (groupedPosts.length > 0) {
      const { data: savedPosts, error: postsError } = await this.supabase
        .from('competitor_posts')
        .upsert(
          groupedPosts.map((p) => ({
            job_id: jobId,
            competitor_id: competitorId,
            post_id: p.post_id,
            post_url: p.post_url,
            text: p.text,
            created_time: p.created_time,
            likes_count: p.likes_count,
            comments_count: p.comments_count,
            shares_count: p.shares_count,
          })),
          { onConflict: 'post_id', ignoreDuplicates: false },
        )
        .select('id, post_id');

      if (postsError) throw new Error(postsError.message);

      const postDbIdByPostId = new Map(
        (savedPosts ?? []).map((p: { id: string; post_id: string }) => [
          p.post_id,
          p.id,
        ]),
      );

      const allComments = groupedPosts.flatMap((p) =>
        p.comments.map((c) => ({
          post_id: postDbIdByPostId.get(p.post_id)!,
          comment_id: c.comment_id,
          text: c.text,
          author_name: c.author_name,
          likes_count: c.likes_count,
          created_time: c.created_time,
        })),
      );

      if (allComments.length > 0) {
        const { error: commentsError } = await this.supabase
          .from('competitor_comments')
          .insert(allComments);
        if (commentsError) throw new Error(commentsError.message);
      }
    }

    // 8. Mark job as completed
    await this.supabase
      .from('competitor_scrape_jobs')
      .update({
        status: 'completed',
        posts_count: groupedPosts.length,
        result_url: urlData?.publicUrl ?? null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    this.logger.log(
      `[Job ${jobId}] Completed: ${groupedPosts.length} posts saved`,
    );
  }

  private async failJob(jobId: string, reason: string): Promise<void> {
    await this.supabase
      .from('competitor_scrape_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: reason.substring(0, 500),
      })
      .eq('id', jobId);
  }

  // ─── Scheduled scrape (weekly) ─────────────────────────────────────

  async scrapeAllUsers(): Promise<void> {
    const { data: competitors, error } = await this.supabase
      .from('competitors')
      .select('id, user_id, page_url');

    if (error) {
      this.logger.error(`scrapeAllUsers fetch error: ${error.message}`);
      return;
    }

    this.logger.log(
      `[Weekly] Scraping ${competitors?.length ?? 0} competitors`,
    );

    for (const comp of competitors ?? []) {
      try {
        const jobId = await this.createScrapeJob(comp.id, comp.user_id);
        this.triggerScrape(jobId, comp.id, comp.page_url);
      } catch (err) {
        this.logger.error(
          `Failed to start scrape for competitor ${comp.id}: ${String(err)}`,
        );
      }
    }
  }
}
