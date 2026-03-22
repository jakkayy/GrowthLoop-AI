import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { buildReviewFlex } from './flex-message.builder';

@Injectable()
export class LineService {
  private readonly token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

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

        if (action === 'approve') {
          await this.replyText(
            event.replyToken,
            `Approved draft ${draftId ?? ''}`.trim(),
          );
        }

        if (action === 'deny') {
          await this.replyText(
            event.replyToken,
            `Denied draft ${draftId ?? ''}`.trim(),
          );
        }
      }
    }

    return 'OK';
  }
}
