import {
IsString,
MaxLength,
MinLength,
} from 'class-validator';

export class CreateMenuDto {

@IsString()
fecha!: string;

@IsString()
@MinLength(3)
@MaxLength(150)
sopa!: string;

}

