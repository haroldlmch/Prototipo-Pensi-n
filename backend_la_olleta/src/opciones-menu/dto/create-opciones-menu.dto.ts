import {
IsInt,
IsString,
MaxLength,
MinLength,
} from 'class-validator';

export class CreateOpcionesMenuDto {

@IsString()
@MinLength(3)
@MaxLength(150)
nombreSegundo!: string;

@IsInt()
idMenu!: number;

}

