import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateExtraDto {
  @IsNotEmpty({ message: 'La fecha es obligatoria.' })
  @IsDateString({}, { message: 'La fecha debe tener un formato válido (YYYY-MM-DD).' })
  fecha!: string;

  @IsNotEmpty({ message: 'La descripción del extra es obligatoria.' })
  @IsString({ message: 'La descripción debe ser un texto válido.' })
  @MaxLength(200, { message: 'La descripción del extra no puede superar los 200 caracteres.' })
  descripcion!: string;

  @IsNumber({}, { message: 'El precio debe ser un número válido.' })
  @Min(0, { message: 'El precio no puede ser negativo.' })
  precio!: number;

  @IsOptional()
  @IsInt({ message: 'El ID de la pensión debe ser un número válido.' })
  idPension?: number;

  @IsOptional()
  @IsString({ message: 'El tipo de cliente debe ser válido.' })
  @MaxLength(30, { message: 'El tipo de cliente no puede superar los 30 caracteres.' })
  tipoCliente?: string;

  @IsOptional()
  @IsString({ message: 'El nombre del cliente casual debe ser un texto válido.' })
  @MaxLength(150, { message: 'El nombre o referencia del cliente casual no puede superar los 150 caracteres.' })
  clienteCasual?: string;

  @IsOptional()
  @IsString({ message: 'El método de pago debe ser un texto válido.' })
  @MaxLength(30, { message: 'El método de pago no puede superar los 30 caracteres.' })
  metodoPago?: string;

  @IsOptional()
  @IsString({ message: 'El estado de pago debe ser válido.' })
  @MaxLength(30, { message: 'El estado de pago no puede superar los 30 caracteres.' })
  estadoPago?: string;
}
