import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OpcionesMenuService } from './opciones-menu.service';
import { CreateOpcionesMenuDto } from './dto/create-opciones-menu.dto';
import { UpdateOpcionesMenuDto } from './dto/update-opciones-menu.dto';

@Controller('opciones-menu')
export class OpcionesMenuController {
  constructor(private readonly opcionesMenuService: OpcionesMenuService) {}

  @Post()
  create(@Body() createOpcionesMenuDto: CreateOpcionesMenuDto) {
    return this.opcionesMenuService.create(createOpcionesMenuDto);
  }

  @Get()
  findAll() {
    return this.opcionesMenuService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.opcionesMenuService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOpcionesMenuDto: UpdateOpcionesMenuDto) {
    return this.opcionesMenuService.update(+id, updateOpcionesMenuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.opcionesMenuService.remove(+id);
  }
}
