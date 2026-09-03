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

export class CreateVentasCasualeDto {
  @IsNotEmpty({ message: 'La fecha de venta es obligatoria.' })
  @IsDateString({}, { message: 'La fecha debe tener un formato válido (YYYY-MM-DD).' })
  fecha!: string;

  @IsInt({ message: 'La cantidad de platos debe ser un número entero.' })
  @Min(1, { message: 'La cantidad de platos debe ser al menos 1.' })
  cantidadCompletos!: number;

  @IsOptional()
  @IsString({ message: 'El tipo de plato debe ser un texto válido.' })
  @MaxLength(30, { message: 'El tipo de plato no puede superar los 30 caracteres.' })
  tipoPlato?: string;

  @IsNumber({}, { message: 'El precio unitario debe ser un número válido.' })
  @Min(0, { message: 'El precio unitario no puede ser negativo.' })
  precioUnitario!: number;

  @IsNumber({}, { message: 'El monto total debe ser un número válido.' })
  @Min(0, { message: 'El monto total no puede ser negativo.' })
  montoTotal!: number;

  @IsOptional()
  @IsString({ message: 'El método de pago debe ser un texto válido.' })
  @MaxLength(30, { message: 'El método de pago no puede superar los 30 caracteres.' })
  metodoPago?: string;

  @IsOptional()
  @IsInt({ message: 'El ID de la opción de menú debe ser un número entero válido.' })
  idOpcionMenu?: number;
}
