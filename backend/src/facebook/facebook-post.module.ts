import { Module } from '@nestjs/common';
import { FacebookPostService } from './facebook-post.service';
import { OwnPageInsightsService } from './own-page-insights.service';
import { OwnPageInsightsController } from './own-page-insights.controller';
import { EngagementReportService } from './engagement-report.service';
import { AutoReplyService } from './auto-reply.service';
import { FacebookWebhookController } from './facebook-webhook.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [OwnPageInsightsController, FacebookWebhookController],
  providers: [FacebookPostService, OwnPageInsightsService, EngagementReportService, AutoReplyService],
  exports: [FacebookPostService, OwnPageInsightsService, EngagementReportService, AutoReplyService],
})
export class FacebookPostModule {}
