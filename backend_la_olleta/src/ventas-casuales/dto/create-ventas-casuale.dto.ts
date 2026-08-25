import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVentasCasualeDto {

@IsDateString()
fecha!: string;

@IsInt()
@Min(1)
cantidadCompletos!: number;

@IsNumber()
@Min(0)
precioUnitario!: number;

@IsNumber()
@Min(0)
montoTotal!: number;

@IsOptional()
@IsString()
metodoPago?: string;

}
