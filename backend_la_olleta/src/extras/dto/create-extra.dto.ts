import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateExtraDto {
  @IsDateString()
  fecha!: string;

  @IsString()
  @MaxLength(200)
  descripcion!: string;

  @IsNumber()
  @Min(0)
  precio!: number;

  @IsOptional()
  @IsInt()
  idPension?: number;

  @IsOptional()
  @IsString()
  tipoCliente?: string;

  @IsOptional()
  @IsString()
  clienteCasual?: string;

  @IsOptional()
  @IsString()
  metodoPago?: string;

  @IsOptional()
  @IsString()
  estadoPago?: string;
}
