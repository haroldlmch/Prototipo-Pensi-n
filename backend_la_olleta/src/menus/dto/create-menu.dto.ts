import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMenuDto {
  @IsString()
  fecha!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(150)
  sopa!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  opciones?: string[];
}

