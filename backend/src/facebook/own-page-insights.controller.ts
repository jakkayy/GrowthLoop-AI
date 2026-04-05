import { Controller, Post, Query, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { OwnPageInsightsService } from './own-page-insights.service';

@Controller('facebook/own-page-insights')
export class OwnPageInsightsController {
  constructor(private readonly service: OwnPageInsightsService) {}

  @Post('analyze')
  @HttpCode(200)
  async analyze(@Query('userId') userId: string) {
    if (!userId) {
      throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.service.analyzeAndSave(userId);
    } catch (err: any) {
      throw new HttpException(
        err?.message ?? 'Analysis failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
