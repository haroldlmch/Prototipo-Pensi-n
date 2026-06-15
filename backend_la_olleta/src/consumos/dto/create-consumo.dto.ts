import {
IsDateString,
IsInt,
IsString,
MaxLength,
Min,
} from 'class-validator';

export class CreateConsumoDto {

@IsDateString()
fecha!: Date;

@IsInt()
@Min(1)
cantidadCompletos!: number;

@IsString()
@MaxLength(30)
tipoConsumo!: string;

@IsInt()
idPension!: number;

@IsInt()
idOpcionMenu!: number;

}


