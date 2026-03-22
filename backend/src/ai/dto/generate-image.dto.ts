import { IsString } from 'class-validator';

export class GenerateImageDto {
  @IsString()
  prompt: string;
}
