import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AiService } from '../ai/ai.service';
import { LineService } from '../line/line.service';
import { StorageService } from '../storage/storage.service';
import { DraftsService } from '../drafts/drafts.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly aiService: AiService,
    private readonly lineService: LineService,
    private readonly storageService: StorageService,
    private readonly draftsService: DraftsService,
  ) {}

  // generate + บันทึก DB (ใช้โดย scheduler ตี 6)
  async generateAndSave(input: { userId: string; lineUserId: string; topic?: string }) {
    const topic = input.topic ?? 'โปรโมทสินค้าและบริการ';

    const { caption } = await this.aiService.generateCaption(
      `เขียนแคปชั่นภาษาไทยสำหรับโพสต์หัวข้อ: ${topic}`,
    );

    const { imageDataUrl } = await this.aiService.generateImage(
      `Create a clean social media promotional image for: ${caption}`,
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
  async generateAndSendToLine(input: { lineUserId: string; topic: string }) {
    const { caption } = await this.aiService.generateCaption(
      `เขียนแคปชั่นภาษาไทยสำหรับโพสต์หัวข้อ: ${input.topic}`,
    );

    const { imageDataUrl } = await this.aiService.generateImage(
      `Create a clean social media promotional image for: ${caption}`,
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
