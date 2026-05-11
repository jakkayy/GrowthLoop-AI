import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import axios from 'axios';
import { AiService } from '../ai/ai.service';

@Injectable()
export class AutoReplyService {
  private readonly logger = new Logger(AutoReplyService.name);
  private readonly supabase: SupabaseClient;
  private readonly apiVersion: string;

  constructor(
    private readonly config: ConfigService,
    private readonly aiService: AiService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    this.apiVersion =
      this.config.get<string>('FACEBOOK_API_VERSION') || 'v19.0';
  }

  async handleNewComment(input: {
    pageId: string;
    postId: string;
    commentId: string;
    commentText: string;
    commenterId: string;
  }) {
    const { pageId, postId, commentId, commentText, commenterId } = input;

    // ไม่ตอบ comment ของ page ตัวเอง
    if (commenterId === pageId) return;

    // เช็คว่า post นี้ระบบโพสต์ไปหรือเปล่า
    const { data: draft } = await this.supabase
      .from('post_drafts')
      .select('user_id')
      .eq('facebook_post_id', postId)
      .single();

    if (!draft) return;

    // กัน reply ซ้ำ
    const { data: existing } = await this.supabase
      .from('replied_comments')
      .select('comment_id')
      .eq('comment_id', commentId)
      .single();

    if (existing) return;

    // ดึง brand profile + access token พร้อมกัน
    const [brandResult, pageResult] = await Promise.all([
      this.supabase
        .from('users')
        .select('brand_name, business_type, tone_brand')
        .eq('user_id', draft.user_id)
        .single(),
      this.supabase
        .from('facebook_pages')
        .select('page_access_token')
        .eq('page_id', pageId)
        .single(),
    ]);

    if (!brandResult.data || !pageResult.data) return;

    const { caption: reply } = await this.aiService.generateCaption(
      buildReplyPrompt(commentText, brandResult.data),
    );

    await axios.post(
      `https://graph.facebook.com/${this.apiVersion}/${commentId}/comments`,
      { message: reply, access_token: pageResult.data.page_access_token },
    );

    await this.supabase.from('replied_comments').insert({
      comment_id: commentId,
      post_id: postId,
      user_id: draft.user_id,
    });

    this.logger.log(`Replied to comment ${commentId} on post ${postId}`);
  }
}

function buildReplyPrompt(
  comment: string,
  brand: {
    brand_name: string | null;
    business_type: string | null;
    tone_brand: string | null;
  },
) {
  return `คุณคือแอดมินของแบรนด์ "${brand.brand_name}" (${brand.business_type})
โทนเสียงของแบรนด์: ${brand.tone_brand}

ลูกค้า comment มาว่า:
"${comment}"

ตอบกลับในนามแบรนด์โดย:
- ใช้โทนเสียงของแบรนด์ให้ถูกต้อง
- กระชับ ไม่เกิน 2-3 ประโยค
- เป็นมิตร กระตุ้น engagement
- ไม่ต้องใส่ hashtag
- ตอบเป็นภาษาเดียวกับ comment`;
}
