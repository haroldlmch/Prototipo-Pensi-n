import {
IsBoolean,
IsOptional,
IsString,
MaxLength,
MinLength,
} from 'class-validator';

export class CreatePensionadoDto {

@IsString()
@MinLength(3)
@MaxLength(150)
nombreCompleto!: string;

@IsOptional()
@IsString()
@MaxLength(20)
telefono?: string;

@IsBoolean()
estado!: boolean;
}


