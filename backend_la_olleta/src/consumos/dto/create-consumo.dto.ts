import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateConsumoDto {
  @IsNotEmpty({ message: 'La fecha de consumo es obligatoria.' })
  @IsDateString({}, { message: 'La fecha debe tener un formato válido (YYYY-MM-DD).' })
  fecha!: string;

  @IsInt({ message: 'La cantidad de platos debe ser un número entero.' })
  @Min(1, { message: 'La cantidad de platos debe ser al menos 1.' })
  cantidadCompletos!: number;

  @IsString({ message: 'La modalidad de consumo debe ser un texto válido.' })
  @MaxLength(30, { message: 'La modalidad de consumo no puede superar los 30 caracteres.' })
  tipoConsumo!: string;

  @IsOptional()
  @IsString({ message: 'El tipo de plato debe ser un texto válido.' })
  @MaxLength(30, { message: 'El tipo de plato no puede superar los 30 caracteres.' })
  tipoPlato?: string;

  @IsOptional()
  @IsString({ message: 'El estado de entrega debe ser un texto válido.' })
  @MaxLength(30, { message: 'El estado de entrega no puede superar los 30 caracteres.' })
  estadoEntrega?: string;

  @IsInt({ message: 'El ID de la pensión debe ser un número entero válido.' })
  idPension!: number;

  @IsOptional()
  @IsInt({ message: 'El ID del plato / opción de menú debe ser un número entero válido.' })
  idOpcionMenu?: number;
}
