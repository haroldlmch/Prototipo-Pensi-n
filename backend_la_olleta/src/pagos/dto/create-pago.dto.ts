import {
IsDateString,
IsInt,
IsNumber,
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

}


