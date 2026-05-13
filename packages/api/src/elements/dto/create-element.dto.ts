import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateElementDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  type: string;

  @IsOptional()
  data: any;

  @IsNumber()
  @IsOptional()
  zIndex?: number;
}
