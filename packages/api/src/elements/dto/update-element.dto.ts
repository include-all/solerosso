import { IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class UpdateElementDto {
  @IsOptional()
  data?: any;

  @IsNumber()
  @IsOptional()
  zIndex?: number;

  @IsBoolean()
  @IsOptional()
  locked?: boolean;
}
