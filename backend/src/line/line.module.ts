import { Module } from '@nestjs/common';
import { LineService } from './line.service';
import { LineController } from './line.controller';
import { DraftsModule } from '../drafts/drafts.module';

@Module({
  imports: [DraftsModule],
  controllers: [LineController],
  providers: [LineService],
  exports: [LineService],
})
export class LineModule {}
