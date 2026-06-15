import {
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateConfiguracionDto {
  @IsNumber()
  @Min(0)
  precioPensionado!: number;

  @IsNumber()
  @Min(0)
  precioCasual!: number;

  @IsNumber()
  @Min(0)
  precioExtra!: number;

  @IsInt()
  @Min(0)
  saldoBajoAlerta!: number;
}
