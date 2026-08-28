import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePensioneDto {
  @IsString()
  fechaInicio!: string;

  @IsInt()
  @Min(1)
  cantidadCompletos!: number;

  @IsInt()
  @Min(0)
  completosDisponibles!: number;

  @IsString()
  @MaxLength(30)
  estado!: string;

  @IsInt()
  idPensionado!: number;

  @IsOptional()
  @IsInt()
  idPensionAnterior?: number;
}


