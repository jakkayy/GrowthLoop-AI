import { Module } from '@nestjs/common';
import { FacebookPostService } from './facebook-post.service';
import { OwnPageInsightsService } from './own-page-insights.service';
import { OwnPageInsightsController } from './own-page-insights.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [OwnPageInsightsController],
  providers: [FacebookPostService, OwnPageInsightsService],
  exports: [FacebookPostService, OwnPageInsightsService],
})
export class FacebookPostModule {}
