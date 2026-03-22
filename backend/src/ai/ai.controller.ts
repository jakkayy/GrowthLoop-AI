import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateCaptionDto } from './dto/generate-caption.dto';
import { GenerateImageDto } from './dto/generate-image.dto';

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
