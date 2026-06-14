import { PartialType } from '@nestjs/mapped-types';
import { CreatePensionadoDto } from './create-pensionado.dto';

export class UpdatePensionadoDto extends PartialType(CreatePensionadoDto) {}
