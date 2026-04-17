import { Module } from '@nestjs/common';
import { FacebookPostService } from './facebook-post.service';
import { OwnPageInsightsService } from './own-page-insights.service';
import { OwnPageInsightsController } from './own-page-insights.controller';
import { EngagementReportService } from './engagement-report.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [OwnPageInsightsController],
  providers: [FacebookPostService, OwnPageInsightsService, EngagementReportService],
  exports: [FacebookPostService, OwnPageInsightsService, EngagementReportService],
})
export class FacebookPostModule {}
