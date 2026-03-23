import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';

@Injectable()
export class FacebookPostService {
  private readonly logger = new Logger(FacebookPostService.name);
  private readonly supabase: SupabaseClient;
  private readonly apiVersion: string;

  constructor(private readonly config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.apiVersion =
      this.config.get<string>('FACEBOOK_API_VERSION') || 'v19.0';
  }

  async postToPages(input: {
    userId: string;
    caption: string;
    imageUrl: string;
  }): Promise<void> {
    const { data: pages, error } = await this.supabase
      .from('facebook_pages')
      .select('page_id, page_name, page_access_token')
      .eq('user_id', input.userId)
      .eq('is_active', true);

    if (error) throw new Error(error.message);
    if (!pages || pages.length === 0) {
      this.logger.warn(`No active Facebook pages for user ${input.userId}`);
      return;
    }

    for (const page of pages) {
      try {
        await axios.post(
          `https://graph.facebook.com/${this.apiVersion}/${page.page_id}/photos`,
          {
            url: input.imageUrl,
            caption: input.caption,
            access_token: page.page_access_token,
          },
        );
        this.logger.log(`Posted to Facebook page "${page.page_name}"`);
      } catch (err: any) {
        this.logger.error(
          `Failed to post to page "${page.page_name}": ${err?.response?.data?.error?.message ?? err.message}`,
        );
      }
    }
  }
}
