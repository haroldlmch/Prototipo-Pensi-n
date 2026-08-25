import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePagoDto {

@IsDateString()
fechaPago!: string;

@IsNumber()
@Min(0)
precioUnitario!: number;

@IsNumber()
@Min(0)
montoTotal!: number;

@IsInt()
idPension!: number;

@IsOptional()
@IsString()
metodoPago?: string;

@IsOptional()
@IsInt()
@Min(1)
cantidadCompletos?: number;

}
