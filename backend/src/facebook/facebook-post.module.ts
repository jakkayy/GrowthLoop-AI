import { Module } from '@nestjs/common';
import { FacebookPostService } from './facebook-post.service';

@Module({
  providers: [FacebookPostService],
  exports: [FacebookPostService],
})
export class FacebookPostModule {}
