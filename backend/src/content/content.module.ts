import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { AiModule } from '../ai/ai.module';
import { LineModule } from '../line/line.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [AiModule, LineModule, StorageModule],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
