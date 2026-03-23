import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios from 'axios';
import { buildReviewFlex } from './flex-message.builder';
import { DraftsService } from '../drafts/drafts.service';

@Injectable()
export class LineService {
  private readonly logger = new Logger(LineService.name);
  private readonly token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  constructor(private readonly draftsService: DraftsService) {}

  async pushReviewFlex(input: {
    to: string;
    draftId: string;
    caption: string;
    imageUrl: string;
  }) {
    try {
      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
          to: input.to,
          messages: [
            buildReviewFlex({
              draftId: input.draftId,
              caption: input.caption,
              imageUrl: input.imageUrl,
            }),
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.response?.data?.message ||
          error?.response?.data ||
          error?.message ||
          'Push LINE failed',
      );
    }
  }

  async replyText(replyToken: string, text: string) {
    await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken,
        messages: [{ type: 'text', text }],
      },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  async handleWebhook(body: any) {
    const events = body.events ?? [];

    for (const event of events) {
      if (event.type === 'postback') {
        const params = new URLSearchParams(event.postback?.data ?? '');
        const action = params.get('action');
        const draftId = params.get('draftId');

        if (!draftId) continue;

        if (action === 'approve') {
          try {
            await this.draftsService.approve(draftId);
            await this.replyText(event.replyToken, '✅ อนุมัติโพสต์แล้ว จะดำเนินการโพสต์ในเร็วๆ นี้');
            this.logger.log(`Draft ${draftId} approved`);
          } catch (err) {
            this.logger.error(`Failed to approve draft ${draftId}: ${err}`);
            await this.replyText(event.replyToken, '❌ เกิดข้อผิดพลาด กรุณาลองใหม่');
          }
        }

        if (action === 'deny') {
          try {
            await this.draftsService.deny(draftId);
            await this.replyText(event.replyToken, '🚫 ปฏิเสธโพสต์แล้ว');
            this.logger.log(`Draft ${draftId} denied`);
          } catch (err) {
            this.logger.error(`Failed to deny draft ${draftId}: ${err}`);
            await this.replyText(event.replyToken, '❌ เกิดข้อผิดพลาด กรุณาลองใหม่');
          }
        }
      }
    }

    return 'OK';
  }
}
