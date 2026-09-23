import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { LineSignatureGuard } from './line-signature.guard';
import { LineService } from './line.service';

@Controller('line')
export class LineController {
  constructor(private line: LineService) {}

  @UseGuards(LineSignatureGuard)
  @Post('webhook')
  webhook(@Body() body: any) {
    return this.line.handleWebhook(body);
  }
}
