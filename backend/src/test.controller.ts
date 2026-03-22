import { Controller, Get, Query } from '@nestjs/common';
import { ContentService } from './content/content.service';

@Controller('test')
export class TestController {
  constructor(private readonly contentService: ContentService) {}

  @Get('send-line')
  async sendLine(
    @Query('userId') userId: string,
    @Query('topic') topic: string,
  ) {
    return this.contentService.generateAndSendToLine({
      lineUserId: userId,
      topic: topic || 'โปรโมทร้านกาแฟเปิดใหม่',
    });
  }
}
