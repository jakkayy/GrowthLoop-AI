import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FacebookPostService } from './facebook-post.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class OwnPageInsightsService {
  private readonly logger = new Logger(OwnPageInsightsService.name);
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly config: ConfigService,
    private readonly facebookPostService: FacebookPostService,
    private readonly aiService: AiService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async analyzeAndSave(userId: string): Promise<{ insights: string }> {
    // 1. ดึง pages ของ user ที่เชื่อมต่ออยู่
    const { data: pages, error } = await this.supabase
      .from('facebook_pages')
      .select('page_id, page_name, page_access_token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw new Error(error.message);
    if (!pages || pages.length === 0) {
      throw new Error('ไม่พบ Facebook Page ที่เชื่อมต่อ');
    }

    // 2. ดึง posts 7 วันล่าสุดจากทุก page แล้วสร้าง summary
    const summaryParts: string[] = [];
    for (const page of pages) {
      try {
        const posts = await this.facebookPostService.getPagePosts(
          page.page_id,
          page.page_access_token,
        );

        if (posts.length === 0) {
          summaryParts.push(
            `=== ${page.page_name} ===\nไม่มีโพสต์ใน 7 วันที่ผ่านมา`,
          );
          continue;
        }

        const postsText = posts
          .map((p, i) => {
            const excerpt = p.message.substring(0, 200).replace(/\n/g, ' ');
            const topComments = p.comments
              .slice(0, 3)
              .map((c) => `  - "${c.text.substring(0, 80)}"`)
              .join('\n');
            return (
              `โพสต์ ${i + 1} (likes: ${p.likes_count}, comments: ${p.comments_count}, shares: ${p.shares_count}):\n"${excerpt}"` +
              (topComments ? `\nคอมเม้นต์:\n${topComments}` : '')
            );
          })
          .join('\n\n');

        summaryParts.push(`=== ${page.page_name} ===\n${postsText}`);
      } catch (err) {
        this.logger.warn(
          `Failed to fetch posts for page ${page.page_name}: ${String(err)}`,
        );
      }
    }

    if (summaryParts.length === 0) {
      throw new Error('ไม่สามารถดึงข้อมูลโพสต์ได้');
    }

    // 3. AI วิเคราะห์
    this.logger.log(`[OwnPageInsights] Analyzing ${pages.length} page(s) for user ${userId}`);
    const { insights } = await this.aiService.analyzeOwnPagePerformance(
      summaryParts.join('\n\n'),
    );

    // 4. บันทึกลง DB
    const { error: insertError } = await this.supabase
      .from('own_page_insights')
      .insert({ user_id: userId, content: insights });

    if (insertError) throw new Error(insertError.message);

    this.logger.log(`[OwnPageInsights] Saved for user ${userId}`);
    return { insights };
  }
}
