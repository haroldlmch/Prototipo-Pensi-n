import {
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateConfiguracionDto {
  @IsNumber({}, { message: 'El precio para pensionados debe ser un número válido.' })
  @Min(0, { message: 'El precio para pensionados no puede ser negativo.' })
  precioPensionado!: number;

  @IsNumber({}, { message: 'El precio para venta casual debe ser un número válido.' })
  @Min(0, { message: 'El precio para venta casual no puede ser negativo.' })
  precioCasual!: number;

  @IsNumber({}, { message: 'El precio extra debe ser un número válido.' })
  @Min(0, { message: 'El precio extra no puede ser negativo.' })
  precioExtra!: number;

  @IsInt({ message: 'El umbral de alerta de saldo bajo debe ser un número entero.' })
  @Min(0, { message: 'El umbral de alerta no puede ser negativo.' })
  saldoBajoAlerta!: number;
}
