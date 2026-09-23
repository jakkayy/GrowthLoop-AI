import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import { buildEngagementReportFlex } from '../line/flex-message.builder';
import { resolveFacebookApiVersion } from './facebook-api.config';

type PostEngagement = {
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  recentComments: { author: string; text: string }[];
};

@Injectable()
export class EngagementReportService {
  private readonly logger = new Logger(EngagementReportService.name);
  private readonly supabase: SupabaseClient;
  private readonly apiVersion: string;
  private readonly lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  constructor(private readonly config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.apiVersion = resolveFacebookApiVersion(this.config);
  }

  private async fetchEngagement(
    postId: string,
    accessToken: string,
  ): Promise<Omit<PostEngagement, 'imageUrl'>> {
    const fields =
      'likes.summary(true),comments.limit(3).summary(true){message,from{name}},shares';
    const { data } = await axios.get(
      `https://graph.facebook.com/${this.apiVersion}/${postId}`,
      { params: { fields, access_token: accessToken } },
    );
    return {
      likesCount: data.likes?.summary?.total_count ?? 0,
      commentsCount: data.comments?.summary?.total_count ?? 0,
      sharesCount: data.shares?.count ?? 0,
      recentComments: (data.comments?.data ?? []).map((c: any) => ({
        author: c.from?.name ?? 'ไม่ทราบชื่อ',
        text: c.message ?? '',
      })),
    };
  }

  async sendDailyReport(userId: string, lineUserId: string) {
    const { data: drafts, error: draftErr } = await this.supabase
      .from('post_drafts')
      .select('id, image_url, facebook_post_id')
      .eq('user_id', userId)
      .eq('status', 'posted')
      .not('facebook_post_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (draftErr) throw new Error(draftErr.message);
    if (!drafts || drafts.length === 0) {
      this.logger.log(`No posted drafts with post_id for user ${userId}`);
      return;
    }

    const { data: pages, error: pageErr } = await this.supabase
      .from('facebook_pages')
      .select('page_id, page_access_token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (pageErr || !pages || pages.length === 0) {
      this.logger.warn(`No active pages for user ${userId}`);
      return;
    }

    const tokenMap = new Map<string, string>(
      pages.map((p) => [p.page_id, p.page_access_token]),
    );

    const posts: (PostEngagement & { index: number })[] = [];
    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      try {
        const pageId = draft.facebook_post_id.split('_')[0];
        const accessToken = tokenMap.get(pageId);
        if (!accessToken) {
          this.logger.warn(`No access token for page ${pageId}`);
          continue;
        }
        const engagement = await this.fetchEngagement(
          draft.facebook_post_id,
          accessToken,
        );
        posts.push({
          index: i + 1,
          imageUrl: draft.image_url,
          ...engagement,
        });
      } catch (err) {
        this.logger.error(
          `Failed to fetch engagement for post ${draft.facebook_post_id}: ${err}`,
        );
      }
    }

    if (posts.length === 0) {
      this.logger.warn(`No engagement data to report for user ${userId}`);
      return;
    }

    const flex = buildEngagementReportFlex(posts, posts.length);
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      { to: lineUserId, messages: [flex] },
      {
        headers: {
          Authorization: `Bearer ${this.lineToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    this.logger.log(
      `Sent engagement report (${posts.length} posts) to LINE for user ${userId}`,
    );
  }
}
