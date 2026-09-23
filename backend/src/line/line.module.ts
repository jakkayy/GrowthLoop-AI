import { Module } from '@nestjs/common';
import { LineService } from './line.service';
import { LineController } from './line.controller';
import { LineSignatureGuard } from './line-signature.guard';
import { DraftsModule } from '../drafts/drafts.module';

@Module({
  imports: [DraftsModule],
  controllers: [LineController],
  providers: [LineService, LineSignatureGuard],
  exports: [LineService],
})
export class LineModule {}
