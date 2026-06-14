import { PartialType } from '@nestjs/mapped-types';
import { CreatePensioneDto } from './create-pensione.dto';

export class UpdatePensioneDto extends PartialType(CreatePensioneDto) {}
