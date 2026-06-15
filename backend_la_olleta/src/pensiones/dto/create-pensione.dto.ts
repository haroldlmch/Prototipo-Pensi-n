import {
IsDateString,
IsInt,
IsString,
Min,
MaxLength,
} from 'class-validator';

export class CreatePensioneDto {


@IsString()
fechaInicio!: string;

@IsInt()
@Min(1)
cantidadCompletos!: number;

@IsInt()
@Min(0)
completosDisponibles!: number;

@IsString()
@MaxLength(30)
estado!: string;

@IsInt()
idPensionado!: number;

}


