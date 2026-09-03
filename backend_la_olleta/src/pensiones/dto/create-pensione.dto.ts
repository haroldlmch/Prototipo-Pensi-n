import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePensioneDto {
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  @IsString({ message: 'La fecha de inicio debe ser válida.' })
  fechaInicio!: string;

  @IsInt({ message: 'La cantidad de platos debe ser un número entero.' })
  @Min(1, { message: 'La cantidad de platos debe ser de al menos 1 plato.' })
  cantidadCompletos!: number;

  @IsInt({ message: 'Los platos disponibles deben ser un número entero.' })
  @Min(0, { message: 'Los platos disponibles no pueden ser negativos.' })
  completosDisponibles!: number;

  @IsString({ message: 'El estado de la pensión debe ser un texto válido.' })
  @MaxLength(30, { message: 'El estado no puede superar los 30 caracteres.' })
  estado!: string;

  @IsInt({ message: 'El ID del pensionado debe ser un número válido.' })
  idPensionado!: number;

  @IsOptional()
  @IsInt({ message: 'El ID de la pensión anterior debe ser un número válido.' })
  idPensionAnterior?: number;
}
