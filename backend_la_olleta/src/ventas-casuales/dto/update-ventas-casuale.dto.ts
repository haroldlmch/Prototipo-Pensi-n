import { PartialType } from '@nestjs/mapped-types';
import { CreateVentasCasualeDto } from './create-ventas-casuale.dto';

export class UpdateVentasCasualeDto extends PartialType(CreateVentasCasualeDto) {}
