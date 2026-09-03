import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOpcionesMenuDto {
  @IsNotEmpty({ message: 'El nombre del plato principal (segundo) es obligatorio.' })
  @IsString({ message: 'El nombre del plato debe ser un texto válido.' })
  @MinLength(2, { message: 'El nombre del plato debe tener al menos 2 caracteres.' })
  @MaxLength(150, { message: 'El nombre del plato no puede superar los 150 caracteres.' })
  nombreSegundo!: string;

  @IsInt({ message: 'El ID del menú debe ser un número entero válido.' })
  idMenu!: number;
}
