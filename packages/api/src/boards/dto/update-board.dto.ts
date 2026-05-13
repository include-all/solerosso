import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
