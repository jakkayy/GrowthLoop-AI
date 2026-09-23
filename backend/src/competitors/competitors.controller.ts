import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InternalApiGuard } from '../auth/internal-api.guard';
import { CompetitorsService } from './competitors.service';
import { AddCompetitorDto } from './dto/add-competitor.dto';

@UseGuards(InternalApiGuard)
@Controller('competitors')
export class CompetitorsController {
  constructor(private readonly competitors: CompetitorsService) {}

  @Post()
  async add(@Body() dto: AddCompetitorDto) {
    const id = await this.competitors.addCompetitor({
      userId: dto.userId,
      pageUrl: dto.pageUrl,
      pageName: dto.pageName,
    });
    return { id };
  }

  @Get()
  async list(@Query('userId') userId: string) {
    return this.competitors.getCompetitors(userId);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @Query('userId') userId: string) {
    await this.competitors.deleteCompetitor(id, userId);
  }

  @Post('analyze')
  @HttpCode(200)
  async analyze(@Query('userId') userId: string) {
    await this.competitors.analyzeForUser(userId);
    return { ok: true };
  }

  @Post(':id/scrape')
  async scrape(
    @Param('id') competitorId: string,
    @Body() body: { userId: string; pageUrl: string },
  ) {
    const jobId = await this.competitors.createScrapeJob(
      competitorId,
      body.userId,
    );
    this.competitors.triggerScrape(jobId, competitorId, body.pageUrl, body.userId);
    return { jobId };
  }
}
