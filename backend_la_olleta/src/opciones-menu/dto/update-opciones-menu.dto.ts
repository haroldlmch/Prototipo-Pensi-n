import { PartialType } from '@nestjs/mapped-types';
import { CreateOpcionesMenuDto } from './create-opciones-menu.dto';

export class UpdateOpcionesMenuDto extends PartialType(CreateOpcionesMenuDto) {}
