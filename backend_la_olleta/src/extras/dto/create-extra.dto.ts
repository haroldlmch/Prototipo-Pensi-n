import {
IsDateString,
IsInt,
IsNumber,
IsString,
MaxLength,
Min,
} from 'class-validator';

export class CreateExtraDto {

@IsDateString()
fecha!: string;

@IsString()
@MaxLength(200)
descripcion!: string;

@IsNumber()
@Min(0)
precio!: number;

@IsInt()
idPension!: number;

}


