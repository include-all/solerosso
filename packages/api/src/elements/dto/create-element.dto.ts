import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateElementDto {
  @IsString()
  type: string;

  data: any;

  @IsNumber()
  @IsOptional()
  zIndex?: number;
}
