import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { LineService } from '../line/line.service';
import { StorageService } from '../storage/storage.service';
import { DraftsService } from '../drafts/drafts.service';

type UserBrandProfile = {
  brand_name: string | null;
  business_type: string | null;
  description: string | null;
  target: string | null;
  tone_brand: string | null;
  ci_color: string | null;
  market_goal: string | null;
  caption_system_prompt: string | null;
  image_prompt_prefix: string | null;
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
      .select('brand_name, business_type, description, target, tone_brand, ci_color, market_goal, caption_system_prompt, image_prompt_prefix')
      .eq('user_id', userId)
      .single();
    return data ?? { brand_name: null, business_type: null, description: null, target: null, tone_brand: null, ci_color: null, market_goal: null, caption_system_prompt: null, image_prompt_prefix: null };
  }

  private async getReferenceImageUrls(userId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from('reference_images')
      .select('image_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    return (data ?? []).map((r) => r.image_url);
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
    return `
คุณคือนักเขียนแคปชั่นโซเชียลมีเดียมืออาชีพของแบรนด์ "${profile.brand_name}"

[ข้อมูลแบรนด์]
- ประเภทธุรกิจ: ${profile.business_type}
- รายละเอียดธุรกิจ: ${profile.description}
- กลุ่มเป้าหมาย: ${profile.target}
- โทนเสียงของแบรนด์: ${profile.tone_brand}
- สีประจำแบรนด์: ${profile.ci_color}
- เป้าหมายการตลาด: ${profile.market_goal}

[หัวข้อโพสต์วันนี้]
${topic}

[สิ่งที่ต้องทำ]
เขียนแคปชั่นภาษาไทย 1 โพสต์ สำหรับ Facebook/Instagram โดย:
1. เปิดด้วย Hook ที่ดึงดูดความสนใจในประโยคแรก (ใช้ emoji ได้)
2. เนื้อหากลางสื่อสารตรงถึงกลุ่มเป้าหมาย ใช้โทนเสียงของแบรนด์ให้ถูกต้อง
3. เน้นจุดขายหรือคุณค่าที่แบรนด์มอบให้ลูกค้า
4. ปิดด้วย Call to Action ที่ชัดเจนและกระตุ้นให้ทัก/คลิก/ซื้อ
5. ใส่ Hashtag ที่เกี่ยวข้อง 5-8 อัน ท้ายโพสต์

${insights ? `[แนวทางจากการวิเคราะห์คู่แข่ง — ให้นำมาปรับใช้ด้วย]\n${insights}` : ''}
    `.trim();
  }

  private buildImagePrompt(caption: string, profile: UserBrandProfile): string {
    if (profile.image_prompt_prefix?.trim()) {
      return `${profile.image_prompt_prefix.trim()}: ${caption}`;
    }
    return `
สร้างภาพโฆษณาโซเชียลมีเดียสำหรับแบรนด์ "${profile.brand_name}"

[ข้อมูลแบรนด์]
- ประเภทธุรกิจ: ${profile.business_type}
- สีประจำแบรนด์: ${profile.ci_color} (ให้ใช้สีนี้เป็นหลักในภาพ)
- บุคลิกและโทนของแบรนด์: ${profile.tone_brand}
- กลุ่มเป้าหมาย: ${profile.target}

[แคปชั่นที่ใช้คู่กับภาพนี้]
"${caption.substring(0, 300)}"

[ข้อกำหนดของภาพ]
- สไตล์: สะอาด ทันสมัย ดูเป็นมืออาชีพ เหมาะกับ Feed Facebook/Instagram
- องค์ประกอบ: ให้ภาพสื่อถึงสินค้าหรือบริการของแบรนด์อย่างชัดเจน
- สี: ใช้โทนสีของแบรนด์เป็นหลัก ไม่ฉูดฉาดเกินไป
- ข้อความในภาพ: ไม่ต้องใส่ข้อความ ยกเว้นชื่อแบรนด์เท่านั้น
- อารมณ์ของภาพ: ต้องสื่ออารมณ์เดียวกับแคปชั่นข้างต้น
    `.trim();
  }

  // generate เพื่อ preview เท่านั้น — ไม่บันทึก DB (ใช้โดย test endpoint)
  async generatePreview(input: { userId: string; topic?: string }) {
    const topic = input.topic ?? 'โปรโมทสินค้าและบริการ';
    const [profile, insights, referenceImageUrls] = await Promise.all([
      this.getUserBrandProfile(input.userId),
      this.getLatestInsights(input.userId),
      this.getReferenceImageUrls(input.userId),
    ]);

    const { caption } = await this.aiService.generateCaption(
      this.buildCaptionPrompt(topic, profile, insights),
      profile.caption_system_prompt,
    );

    const { imageDataUrl } = await this.aiService.generateImage(
      this.buildImagePrompt(caption, profile),
      referenceImageUrls,
    );

    const imageUrl = await this.storageService.saveDataUrlAsPublicImage(imageDataUrl);

    return { caption, imageUrl };
  }

  // generate + บันทึก DB (ใช้โดย scheduler ตี 6)
  async generateAndSave(input: { userId: string; lineUserId: string; topic?: string }) {
    const topic = input.topic ?? 'โปรโมทสินค้าและบริการ';
    const [profile, insights, referenceImageUrls] = await Promise.all([
      this.getUserBrandProfile(input.userId),
      this.getLatestInsights(input.userId),
      this.getReferenceImageUrls(input.userId),
    ]);

    const { caption } = await this.aiService.generateCaption(
      this.buildCaptionPrompt(topic, profile, insights),
      profile.caption_system_prompt,
    );

    const { imageDataUrl } = await this.aiService.generateImage(
      this.buildImagePrompt(caption, profile),
      referenceImageUrls,
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
    const [profile, insights, referenceImageUrls] = await Promise.all([
      input.userId
        ? this.getUserBrandProfile(input.userId)
        : Promise.resolve({ brand_name: null, business_type: null, description: null, target: null, tone_brand: null, ci_color: null, market_goal: null, caption_system_prompt: null, image_prompt_prefix: null }),
      input.userId ? this.getLatestInsights(input.userId) : Promise.resolve(null),
      input.userId ? this.getReferenceImageUrls(input.userId) : Promise.resolve([]),
    ]);

    const { caption } = await this.aiService.generateCaption(
      this.buildCaptionPrompt(input.topic, profile, insights),
      profile.caption_system_prompt,
    );

    const { imageDataUrl } = await this.aiService.generateImage(
      this.buildImagePrompt(caption, profile),
      referenceImageUrls,
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
