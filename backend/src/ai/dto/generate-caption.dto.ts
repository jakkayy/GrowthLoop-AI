import { IsString } from 'class-validator';

export class GenerateCaptionDto {
  @IsString()
  prompt: string;
}
