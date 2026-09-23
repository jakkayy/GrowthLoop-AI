import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InternalApiGuard } from './auth/internal-api.guard';
import { ContentService } from './content/content.service';

/**
 * Backs the admin "test generate" panel (preview AI output for a user
 * without creating a real draft or sending anything). Guarded the same
 * way as the other internal-only controllers — only the Next.js admin
 * route is allowed to call it, and that route itself checks the caller
 * has the admin role before forwarding the request.
 *
 * The old `send-line` action (generated a real draft AND pushed it to a
 * real LINE user) was unused by the frontend and far too dangerous to
 * leave reachable, so it has been removed rather than just guarded.
 */
@UseGuards(InternalApiGuard)
@Controller('test')
export class TestController {
  constructor(private readonly contentService: ContentService) {}

  @Get('preview')
  async preview(
    @Query('userId') userId: string,
    @Query('topic') topic: string,
  ) {
    return this.contentService.generatePreview({
      userId,
      topic: topic || 'โปรโมทสินค้าและบริการ',
    });
  }
}
