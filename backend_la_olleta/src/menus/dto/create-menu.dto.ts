import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMenuDto {
  @IsNotEmpty({ message: 'La fecha del menú es obligatoria.' })
  @IsString({ message: 'La fecha debe ser un texto válido.' })
  fecha!: string;

  @IsNotEmpty({ message: 'El nombre de la sopa es obligatorio.' })
  @IsString({ message: 'El nombre de la sopa debe ser un texto válido.' })
  @MinLength(2, { message: 'El nombre de la sopa debe tener al menos 2 caracteres.' })
  @MaxLength(150, { message: 'El nombre de la sopa no puede superar los 150 caracteres.' })
  sopa!: string;

  @IsOptional()
  @IsArray({ message: 'Las opciones del menú deben ser una lista.' })
  @IsString({ each: true, message: 'Cada opción de plato debe ser un texto válido.' })
  opciones?: string[];
}
