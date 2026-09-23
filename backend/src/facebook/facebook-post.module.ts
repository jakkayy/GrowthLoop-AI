import { Module } from '@nestjs/common';
import { FacebookPostService } from './facebook-post.service';
import { OwnPageInsightsService } from './own-page-insights.service';
import { OwnPageInsightsController } from './own-page-insights.controller';
import { EngagementReportService } from './engagement-report.service';
import { AutoReplyService } from './auto-reply.service';
import { FacebookWebhookController } from './facebook-webhook.controller';
import { FacebookSignatureGuard } from './facebook-signature.guard';
import { AiModule } from '../ai/ai.module';
import { LineModule } from '../line/line.module';

@Module({
  imports: [AiModule, LineModule],
  controllers: [OwnPageInsightsController, FacebookWebhookController],
  providers: [
    FacebookPostService,
    OwnPageInsightsService,
    EngagementReportService,
    AutoReplyService,
    FacebookSignatureGuard,
  ],
  exports: [
    FacebookPostService,
    OwnPageInsightsService,
    EngagementReportService,
    AutoReplyService,
  ],
})
export class FacebookPostModule {}
