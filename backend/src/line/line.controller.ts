import { Body, Controller, Post } from '@nestjs/common';
import { LineService } from './line.service';

@Controller('line')
export class LineController {
  constructor(private line: LineService) {}

  @Post('webhook')
  webhook(@Body() body: any) {
    return this.line.handleWebhook(body);
  }
}
