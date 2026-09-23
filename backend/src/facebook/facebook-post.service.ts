import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import { resolveFacebookApiVersion } from './facebook-api.config';
import { LineService } from '../line/line.service';

// Facebook's OAuthException code for an invalid/expired access token.
// https://developers.facebook.com/docs/graph-api/guides/error-handling
const FACEBOOK_INVALID_TOKEN_ERROR_CODE = 190;

export type OwnPost = {
  post_id: string;
  message: string;
  created_time: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  comments: { text: string; author: string; created_time: string }[];
};

@Injectable()
export class FacebookPostService {
  private readonly logger = new Logger(FacebookPostService.name);
  private readonly supabase: SupabaseClient;
  private readonly apiVersion: string;

  constructor(
    private readonly config: ConfigService,
    private readonly lineService: LineService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.apiVersion = resolveFacebookApiVersion(this.config);
  }

  async getPagePosts(pageId: string, accessToken: string): Promise<OwnPost[]> {
    const since = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const fields = [
      'message',
      'created_time',
      'likes.summary(true)',
      'comments.summary(true){message,from,created_time}',
      'shares',
    ].join(',');

    const { data } = await axios.get(
      `https://graph.facebook.com/${this.apiVersion}/${pageId}/posts`,
      { params: { fields, access_token: accessToken, since, limit: 20 } },
    );

    return (data.data ?? []).map((p: any) => ({
      post_id: p.id,
      message: p.message ?? '',
      created_time: p.created_time,
      likes_count: p.likes?.summary?.total_count ?? 0,
      comments_count: p.comments?.summary?.total_count ?? 0,
      shares_count: p.shares?.count ?? 0,
      comments: (p.comments?.data ?? []).map((c: any) => ({
        text: c.message ?? '',
        author: c.from?.name ?? '',
        created_time: c.created_time,
      })),
    }));
  }

  async postToPages(input: {
    userId: string;
    caption: string;
    imageUrl: string;
  }): Promise<string | null> {
    const { data: pages, error } = await this.supabase
      .from('facebook_pages')
      .select('page_id, page_name, page_access_token')
      .eq('user_id', input.userId)
      .eq('is_active', true);

    if (error) throw new Error(error.message);
    if (!pages || pages.length === 0) {
      this.logger.warn(`No active Facebook pages for user ${input.userId}`);
      return null;
    }

    let firstPostId: string | null = null;

    for (const page of pages) {
      try {
        const { data: res } = await axios.post(
          `https://graph.facebook.com/${this.apiVersion}/${page.page_id}/photos`,
          {
            url: input.imageUrl,
            caption: input.caption,
            access_token: page.page_access_token,
          },
        );
        this.logger.log(`Posted to Facebook page "${page.page_name}"`);
        if (!firstPostId) {
          firstPostId = (res?.post_id ??
            `${page.page_id}_${res?.id}`) as string;
        }
      } catch (err: any) {
        const fbError = err?.response?.data?.error;
        this.logger.error(
          `Failed to post to page "${page.page_name}": ${fbError?.message ?? err.message}`,
        );

        if (fbError?.code === FACEBOOK_INVALID_TOKEN_ERROR_CODE) {
          await this.handleInvalidPageToken(
            input.userId,
            page.page_id,
            page.page_name,
          );
        }
      }
    }

    return firstPostId;
  }

  /**
   * The page's access token is dead (revoked, expired, or the user
   * disconnected the app on Facebook's side). Deactivate it so we stop
   * retrying with a token that will never work, and tell the customer via
   * LINE so they know to reconnect — otherwise their scheduled posts would
   * silently stop appearing with no visible error anywhere they'd see it.
   * Deactivating also means this only fires once per broken page, not on
   * every future posting attempt.
   */
  private async handleInvalidPageToken(
    userId: string,
    pageId: string,
    pageName: string,
  ) {
    const { error: deactivateError } = await this.supabase
      .from('facebook_pages')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('page_id', pageId);

    if (deactivateError) {
      this.logger.error(
        `Failed to deactivate page "${pageName}" after invalid token: ${deactivateError.message}`,
      );
    }

    const { data: connection } = await this.supabase
      .from('line_connections')
      .select('line_user_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!connection?.line_user_id) return;

    await this.lineService.pushText(
      connection.line_user_id,
      `⚠️ การเชื่อมต่อ Facebook Page "${pageName}" หมดอายุหรือถูกยกเลิก ระบบหยุดโพสต์ให้เพจนี้ชั่วคราว กรุณาเชื่อมต่อ Facebook ใหม่อีกครั้งในหน้าตั้งค่า`,
    );
  }
}
