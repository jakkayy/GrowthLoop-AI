import { IsString, IsUrl } from 'class-validator';

export class AddCompetitorDto {
  @IsString()
  userId: string;

  @IsUrl()
  pageUrl: string;

  @IsString()
  pageName: string;
}
