import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
      images?: Array<{
        image_url?: {
          url?: string;
        };
      }>;
    };
  }>;
};
 
@Injectable()
export class AiService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private static readonly DEFAULT_CAPTION_SYSTEM_PROMPT =
    'คุณคือผู้เชี่ยวชาญด้านการเขียน Caption การตลาด (Marketing Copywriter) สำหรับธุรกิจ [ประเภทธุรกิจ]\n\nหน้าที่ของคุณคือเขียน Caption สำหรับโพสต์ Facebook/Instagram โดยต้องมีลักษณะดังนี้:\n\n[INPUT]\n- เป้าหมายโพสต์: {เช่น โปรโมทบริการ / โปรโมทงานสัมมนา / ให้ความรู้}\n- กลุ่มเป้าหมาย: {เช่น เจ้าของแบรนด์สกินแคร์ / SME / คนเริ่มทำธุรกิจ}\n- จุดขายหลัก (Key Message): {ใส่สิ่งที่อยากขาย}\n- Tone: {เช่น มืออาชีพ / เป็นกันเอง / น่าเชื่อถือ / เร้าใจ}\n- Call to Action: {เช่น ทักแชท / ลงทะเบียน / ซื้อเลย}\n\n[STYLE REQUIREMENTS]\n1. เปิดโพสต์ด้วย Hook ที่ดึงดูด (มี emoji ได้)\n2. ใช้ภาษาการตลาด อ่านง่าย กระตุ้นความสนใจ\n3. มีการแบ่งย่อหน้าให้สบายตา\n4. ใช้ bullet point (🔍 🛠 📈 💡) เมื่อต้องการเน้นจุดสำคัญ\n5. ปิดท้ายด้วย Call to Action ชัดเจน\n6. ใส่ Hashtag ที่เกี่ยวข้อง 5–10 อัน\n\n[OUTPUT FORMAT]\nเขียน Caption พร้อม emoji ได้เลย ไม่ต้องมี label หรือหัวข้อนำ ปิดท้ายด้วย Hashtag บรรทัดสุดท้าย\n\n[IMPORTANT]\n- หลีกเลี่ยงภาษาทางการเกินไป\n- ทำให้รู้สึก "อยากทัก / อยากคลิก"\n- เขียนให้ดู Premium และน่าเชื่อถือ';

  async generateCaption(
    prompt: string,
    systemPrompt?: string | null,
  ): Promise<{ caption: string }> {
    try {
      const data = await this.postToOpenRouter({
        model: this.config.get<string>('OPENROUTER_CAPTION_MODEL'),
        messages: [
          {
            role: 'system',
            content: systemPrompt?.trim() || AiService.DEFAULT_CAPTION_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const caption = data?.choices?.[0]?.message?.content;

      if (typeof caption !== 'string' || !caption.trim()) {
        throw new InternalServerErrorException('Caption not returned');
      }

      return { caption: caption.trim() };
    } catch (error) {
      this.handleAiError(error, 'Generate caption failed');
    }
  }

  async analyzeCompetitorInsights(summary: string): Promise<{ insights: string }> {
    try {
      const data = await this.postToOpenRouter({
        model: this.config.get<string>('OPENROUTER_CAPTION_MODEL'),
        messages: [
          {
            role: 'system',
            content:
              'คุณคือนักวิเคราะห์การตลาดดิจิทัลผู้เชี่ยวชาญ Facebook Content Strategy\n\nหน้าที่ของคุณคือวิเคราะห์โพสต์และคอมเม้นต์จากเพจ Facebook ของคู่แข่ง แล้วให้แนวทางเชิงกลยุทธ์เพื่อช่วยให้แบรนด์ลูกค้าสร้างคอนเทนต์ที่ดีกว่าและชนะคู่แข่ง\n\n[สิ่งที่ต้องวิเคราะห์]\n- โพสต์ไหนได้ engagement (likes/comments/shares) สูงสุด และเพราะอะไร\n- รูปแบบ/ธีมของคอนเทนต์ที่คนตอบสนองดี\n- โทนและสไตล์การเขียนที่ใช้ได้ผล\n- ช่องว่างหรือจุดอ่อนของคู่แข่งที่สามารถใช้ประโยชน์ได้\n\n[รูปแบบผลลัพธ์]\nตอบเป็นแนวทางการสร้างคอนเทนต์ภาษาไทย เขียนให้กระชับ ชัดเจน และนำไปใช้ได้ทันที\nใช้รูปแบบ bullet points ไม่เกิน 8 ข้อ แต่ละข้อต้องบอกชัดว่า "ทำอะไร" และ "เพราะอะไร"\nไม่ต้องมีคำนำหรือสรุปท้าย ให้เริ่มที่แนวทางเลย',
          },
          {
            role: 'user',
            content: `วิเคราะห์ข้อมูลคู่แข่งต่อไปนี้และให้แนวทางการสร้างคอนเทนต์:\n\n${summary}`,
          },
        ],
      });

      const insights = data?.choices?.[0]?.message?.content;
      if (typeof insights !== 'string' || !insights.trim()) {
        throw new InternalServerErrorException('Insights not returned');
      }
      return { insights: insights.trim() };
    } catch (error) {
      this.handleAiError(error, 'Analyze competitor insights failed');
    }
  }

  async analyzeOwnPagePerformance(summary: string): Promise<{ insights: string }> {
    try {
      const data = await this.postToOpenRouter({
        model: this.config.get<string>('OPENROUTER_CAPTION_MODEL'),
        messages: [
          {
            role: 'system',
            content:
              'คุณคือผู้เชี่ยวชาญ Facebook Content Analytics\n\nวิเคราะห์ performance โพสต์ 7 วันที่ผ่านมาของเพจ แล้วให้แนวทางเพื่อปรับปรุง content strategy\n\n[สิ่งที่ต้องวิเคราะห์]\n- โพสต์ไหนได้ engagement (likes/comments/shares) ดีที่สุดและทำไม\n- ธีม/รูปแบบ/โทนของ content ที่คนตอบสนองดี\n- ข้อสังเกตจาก comment ที่แสดงถึงความต้องการของ audience\n- ข้อเสนอแนะเป็น action item สำหรับ content ถัดไป\n\n[รูปแบบผลลัพธ์]\nตอบเป็น bullet points ภาษาไทย ไม่เกิน 8 ข้อ\nแต่ละข้อบอกชัดว่า "ทำอะไร" และ "เพราะอะไร" หรือ "จากข้อมูลอะไร"\nไม่ต้องมีคำนำหรือสรุปท้าย',
          },
          {
            role: 'user',
            content: `วิเคราะห์ performance ของเพจจากข้อมูล 7 วันล่าสุด:\n\n${summary}`,
          },
        ],
      });

      const insights = data?.choices?.[0]?.message?.content;
      if (typeof insights !== 'string' || !insights.trim()) {
        throw new InternalServerErrorException('Insights not returned');
      }
      return { insights: insights.trim() };
    } catch (error) {
      this.handleAiError(error, 'Analyze own page performance failed');
    }
  }

  async generateImage(
    prompt: string,
    referenceImageUrls?: string[],
  ): Promise<{ imageDataUrl: string }> {
    try {
      const hasRefs = referenceImageUrls && referenceImageUrls.length > 0;

      const content: unknown = hasRefs
        ? [
            ...referenceImageUrls.map((url) => ({
              type: 'image_url',
              image_url: { url },
            })),
            {
              type: 'text',
              text: `The provided images are style references only. Study their visual style: color palette, mood, lighting, and design aesthetic. Then CREATE AN ENTIRELY NEW AND ORIGINAL image — do NOT reproduce, reuse, or closely imitate the subjects, objects, composition, or content of the reference images. Generate fresh visual content based on this brief: ${prompt}`,
            },
          ]
        : prompt;

      const data = await this.postToOpenRouter(
        {
          model: this.config.get<string>('OPENROUTER_IMAGE_MODEL'),
          modalities: ['image', 'text'],
          messages: [
            {
              role: 'user',
              content,
            },
          ],
        },
        120000,
      );

      const message = data?.choices?.[0]?.message;

      const imageDataUrl =
        this.pickDataImageUrl(message?.images?.[0]?.image_url?.url) ??
        this.extractImageDataUrl(message?.content);

      if (!imageDataUrl) {
        throw new InternalServerErrorException('Image not returned');
      }

      return { imageDataUrl };
    } catch (error) {
      console.error(
        'GENERATE IMAGE ERROR:',
        JSON.stringify(
          (error as any)?.response?.data || (error as any)?.message,
          null,
          2,
        ),
      );

      this.handleAiError(error, 'Generate image failed');
    }
  }

  private async postToOpenRouter(
    body: Record<string, unknown>,
    timeout = 15000,
  ): Promise<OpenRouterResponse> {
    const response = await firstValueFrom(
      this.http.post(
        `${this.config.get<string>('OPENROUTER_BASE_URL')}/chat/completions`,
        body,
        {
          headers: {
            Authorization: `Bearer ${this.config.get<string>('OPENROUTER_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          timeout,
        },
      ),
    );

    return response.data;
  }

  private handleAiError(error: unknown, fallbackMessage: string): never {
    const status = (error as any)?.response?.status;
    const message =
      (error as any)?.response?.data?.error?.message ||
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      fallbackMessage;

    if (status === 401) {
      throw new UnauthorizedException(message);
    }

    throw new InternalServerErrorException(message);
  }

  private extractImageDataUrl(content: unknown): string | null {
    if (!content) return null;

    if (typeof content === 'string') {
      return this.extractDataUrlFromText(content);
    }

    if (Array.isArray(content)) {
      for (const item of content) {
        const imageDataUrl = this.extractImageDataUrl(item);
        if (imageDataUrl) return imageDataUrl;
      }
      return null;
    }

    if (typeof content !== 'object') {
      return null;
    }

    const obj = content as Record<string, any>;

    return (
      this.pickDataImageUrl(obj?.images?.[0]?.image_url?.url) ??
      this.pickDataImageUrl(obj?.image_url) ??
      this.pickDataImageUrl(obj?.image_url?.url) ??
      this.pickDataImageUrl(obj?.url) ??
      this.pickDataImageUrl(obj?.data) ??
      this.buildDataUrlFromSource(obj?.source) ??
      this.buildDataUrlFromB64(obj?.b64_json) ??
      null
    );
  }

  private extractDataUrlFromText(text: string): string | null {
    const match = text.match(
      /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/,
    );

    return match?.[0] ?? null;
  }

  private pickDataImageUrl(value: unknown): string | null {
    return typeof value === 'string' && value.startsWith('data:image/')
      ? value
      : null;
  }

  private buildDataUrlFromSource(source: unknown): string | null {
    if (
      source &&
      typeof source === 'object' &&
      typeof (source as any).data === 'string' &&
      typeof (source as any).media_type === 'string'
    ) {
      return `data:${(source as any).media_type};base64,${(source as any).data}`;
    }

    return null;
  }

  private buildDataUrlFromB64(b64: unknown): string | null {
    return typeof b64 === 'string' && b64.length > 0
      ? `data:image/png;base64,${b64}`
      : null;
  }
}
