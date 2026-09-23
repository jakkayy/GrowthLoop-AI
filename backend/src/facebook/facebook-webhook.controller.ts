import { Controller, Get, Post, Body, Query, Logger, ForbiddenException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AutoReplyService } from './auto-reply.service';
import { FacebookSignatureGuard } from './facebook-signature.guard';

@Controller('facebook/webhook')
export class FacebookWebhookController {
  private readonly logger = new Logger(FacebookWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly autoReplyService: AutoReplyService,
  ) {}

  // Facebook ส่ง GET มา verify endpoint
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const verifyToken = this.config.get<string>('FACEBOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Facebook webhook verified');
      return challenge;
    }
    throw new ForbiddenException();
  }

  // Facebook ส่ง POST เมื่อมี event ใหม่
  @UseGuards(FacebookSignatureGuard)
  @Post()
  async handleEvent(@Body() body: any) {
    const entries = body?.entry ?? [];

    for (const entry of entries) {
      const pageId: string = entry.id;
      const changes = entry.changes ?? [];

      for (const change of changes) {
        if (change.field !== 'feed') continue;

        const val = change.value;

        // เฉพาะ comment ใหม่ ไม่รับ edit/remove และไม่รับ reply ของ comment (มี parent_id)
        if (val?.item !== 'comment' || val?.verb !== 'add' || val?.parent_id) {
          continue;
        }

        this.autoReplyService
          .handleNewComment({
            pageId,
            postId: val.post_id ?? '',
            commentId: val.comment_id ?? '',
            commentText: val.message ?? '',
            commenterId: val.from?.id ?? '',
          })
          .catch((err) =>
            this.logger.error(`Auto-reply failed for comment ${val.comment_id}: ${err}`),
          );
      }
    }

    // ต้อง return 200 ทันที ไม่งั้น Facebook จะ retry
    return 'EVENT_RECEIVED';
  }
}
