import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePensionadoDto {
  @IsNotEmpty({ message: 'El nombre completo es obligatorio.' })
  @IsString({ message: 'El nombre completo debe ser un texto válido.' })
  @MinLength(3, { message: 'El nombre completo debe tener al menos 3 caracteres.' })
  @MaxLength(150, { message: 'El nombre completo no puede superar los 150 caracteres.' })
  nombreCompleto!: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto válido.' })
  @MaxLength(20, { message: 'El número de teléfono no puede superar los 20 caracteres.' })
  telefono?: string;

  @IsBoolean({ message: 'El estado debe ser activo o inactivo.' })
  estado!: boolean;
}
