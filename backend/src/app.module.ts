import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { LineModule } from './line/line.module';
import { ContentModule } from './content/content.module';
import { StorageModule } from './storage/storage.module';
import { TestController } from './test.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AiModule,
    LineModule,
    ContentModule,
    StorageModule,
  ],
  controllers: [TestController],
})
export class AppModule {}
