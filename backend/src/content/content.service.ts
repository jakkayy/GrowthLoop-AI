import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { LineService } from '../line/line.service';
import { StorageService } from '../storage/storage.service';
import { DraftsService } from '../drafts/drafts.service';

type UserBrandProfile = {
  business_type: string | null;
  description: string | null;
  tone_brand: string | null;
  ci_color: string | null;
};

@Injectable()
export class ContentService {
  private readonly supabase: SupabaseClient;

  constructor(
    private readonly aiService: AiService,
    private readonly lineService: LineService,
    private readonly storageService: StorageService,
    private readonly draftsService: DraftsService,
    private readonly config: ConfigService,
  ) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  private async getUserBrandProfile(userId: string): Promise<UserBrandProfile> {
    const { data } = await this.supabase
      .from('users')
      .select('business_type, description, tone_brand, ci_color')
      .eq('user_id', userId)
      .single();
    return data ?? { business_type: null, description: null, tone_brand: null, ci_color: null };
  }

  private async getLatestInsights(userId: string): Promise<string | null> {
    const { data } = await this.supabase
      .from('competitor_insights')
      .select('content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return data?.content ?? null;
  }

  private buildCaptionPrompt(
    topic: string,
    profile: UserBrandProfile,
    insights: string | null,
  ): string {
    const lines = [`เขียนแคปชั่นภาษาไทยสำหรับโพสต์หัวข้อ: ${topic}`];
    if (profile.business_type) lines.push(`ประเภทธุรกิจ: ${profile.business_type}`);
    if (profile.description) lines.push(`รายละเอียดธุรกิจ: ${profile.description}`);
    if (profile.tone_brand) lines.push(`โทนเสียงแบรนด์: ${profile.tone_brand}`);
    if (profile.ci_color) lines.push(`สีประจำแบรนด์: ${profile.ci_color}`);
    if (insights) {
      lines.push(`\nแนวทางการสร้างคอนเทนต์เพื่อชนะคู่แข่ง (ให้ยึดแนวทางนี้เป็นหลัก):\n${insights}`);
    }
    return lines.join('\n');
  }

  private buildImagePrompt(caption: string, profile: UserBrandProfile): string {
    const lines = [`Create a clean social media promotional image for: ${caption}`];
    if (profile.business_type) lines.push(`Business type: ${profile.business_type}`);
    if (profile.tone_brand) lines.push(`Brand tone: ${profile.tone_brand}`);
    if (profile.ci_color) lines.push(`Brand colors: ${profile.ci_color}`);
    return lines.join('. ');
  }

  // generate + บันทึก DB (ใช้โดย scheduler ตี 6)
  async generateAndSave(input: { userId: string; lineUserId: string; topic?: string }) {
    const topic = input.topic ?? 'โปรโมทสินค้าและบริการ';
    const [profile, insights] = await Promise.all([
      this.getUserBrandProfile(input.userId),
      this.getLatestInsights(input.userId),
    ]);

    const { caption } = await this.aiService.generateCaption(
      this.buildCaptionPrompt(topic, profile, insights),
    );

    const { imageDataUrl } = await this.aiService.generateImage(
      this.buildImagePrompt(caption, profile),
    );

    const imageUrl =
      await this.storageService.saveDataUrlAsPublicImage(imageDataUrl);

    const draftId = await this.draftsService.create({
      userId: input.userId,
      lineUserId: input.lineUserId,
      caption,
      imageUrl,
    });

    return { draftId, caption, imageUrl };
  }

  // generate + ส่ง LINE ทันที (ใช้สำหรับ test)
  async generateAndSendToLine(input: { lineUserId: string; topic: string; userId?: string }) {
    const [profile, insights] = await Promise.all([
      input.userId
        ? this.getUserBrandProfile(input.userId)
        : Promise.resolve({ business_type: null, description: null, tone_brand: null, ci_color: null }),
      input.userId ? this.getLatestInsights(input.userId) : Promise.resolve(null),
    ]);

    const { caption } = await this.aiService.generateCaption(
      this.buildCaptionPrompt(input.topic, profile, insights),
    );

    const { imageDataUrl } = await this.aiService.generateImage(
      this.buildImagePrompt(caption, profile),
    );

    const imageUrl =
      await this.storageService.saveDataUrlAsPublicImage(imageDataUrl);

    const draftId = randomUUID();

    await this.lineService.pushReviewFlex({
      to: input.lineUserId,
      draftId,
      caption,
      imageUrl,
    });

    return { draftId, caption, imageUrl };
  }
}
