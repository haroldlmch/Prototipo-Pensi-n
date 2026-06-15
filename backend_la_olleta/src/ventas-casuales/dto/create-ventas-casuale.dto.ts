import {
IsDateString,
IsInt,
IsNumber,
Min,
} from 'class-validator';

export class CreateVentasCasualeDto {

@IsDateString()
fecha!: Date;

@IsInt()
@Min(1)
cantidadCompletos!: number;

@IsNumber()
@Min(0)
precioUnitario!: number;

@IsNumber()
@Min(0)
montoTotal!: number;

}


