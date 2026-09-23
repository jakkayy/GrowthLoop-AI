import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InternalApiGuard } from '../auth/internal-api.guard';
import { AiService } from './ai.service';
import { GenerateCaptionDto } from './dto/generate-caption.dto';
import { GenerateImageDto } from './dto/generate-image.dto';

@UseGuards(InternalApiGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('caption')
  async generateCaption(@Body() body: GenerateCaptionDto) {
    return this.aiService.generateCaption(body.prompt);
  }

  @Post('image')
  async generateImage(@Body() body: GenerateImageDto) {
    return this.aiService.generateImage(body.prompt);
  }
}
