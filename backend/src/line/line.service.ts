import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import { buildReviewFlex } from './flex-message.builder';
import { DraftsService } from '../drafts/drafts.service';

type LinePostbackEvent = {
  type: 'postback';
  replyToken: string;
  postback: { data: string };
  source: { type: string; userId?: string };
};

type LineEvent = LinePostbackEvent | { type: string };

type LineWebhookBody = {
  events: LineEvent[];
};

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
    try {
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
    } catch (error: any) {
      this.logger.error(`Failed to reply LINE message: ${error?.message}`);
    }
  }

  async handleWebhook(body: LineWebhookBody) {
    const events = body.events ?? [];

    for (const event of events) {
      if (event.type === 'postback') {
        const postback = event as LinePostbackEvent;
        const params = new URLSearchParams(postback.postback?.data ?? '');
        const action = params.get('action');
        const draftId = params.get('draftId');
        const lineUserId = postback.source?.userId;

        if (!draftId || !lineUserId) continue;

        if (action === 'approve') {
          try {
            const ok = await this.draftsService.approve(draftId, lineUserId);
            await this.replyText(
              postback.replyToken,
              ok
                ? '✅ อนุมัติโพสต์แล้ว จะดำเนินการโพสต์ในเร็วๆ นี้'
                : '⚠️ ไม่พบโพสต์นี้ หรืออนุมัติ/ปฏิเสธไปแล้ว',
            );
            if (ok) this.logger.log(`Draft ${draftId} approved`);
            else
              this.logger.warn(
                `Approve rejected for draft ${draftId}: not pending or not owned by ${lineUserId}`,
              );
          } catch (err) {
            this.logger.error(`Failed to approve draft ${draftId}: ${err}`);
            await this.replyText(
              postback.replyToken,
              '❌ เกิดข้อผิดพลาด กรุณาลองใหม่',
            );
          }
        } else if (action === 'deny') {
          try {
            const ok = await this.draftsService.deny(draftId, lineUserId);
            await this.replyText(
              postback.replyToken,
              ok
                ? '🚫 ปฏิเสธโพสต์แล้ว'
                : '⚠️ ไม่พบโพสต์นี้ หรืออนุมัติ/ปฏิเสธไปแล้ว',
            );
            if (ok) this.logger.log(`Draft ${draftId} denied`);
            else
              this.logger.warn(
                `Deny rejected for draft ${draftId}: not pending or not owned by ${lineUserId}`,
              );
          } catch (err) {
            this.logger.error(`Failed to deny draft ${draftId}: ${err}`);
            await this.replyText(
              postback.replyToken,
              '❌ เกิดข้อผิดพลาด กรุณาลองใหม่',
            );
          }
        }
      }
    }

    return 'OK';
  }
}
