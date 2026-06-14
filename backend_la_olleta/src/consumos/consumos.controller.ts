import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConsumosService } from './consumos.service';
import { CreateConsumoDto } from './dto/create-consumo.dto';
import { UpdateConsumoDto } from './dto/update-consumo.dto';

@Controller('consumos')
export class ConsumosController {
  constructor(private readonly consumosService: ConsumosService) {}

  @Post()
  create(@Body() createConsumoDto: CreateConsumoDto) {
    return this.consumosService.create(createConsumoDto);
  }

  @Get()
  findAll() {
    return this.consumosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consumosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConsumoDto: UpdateConsumoDto) {
    return this.consumosService.update(+id, updateConsumoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consumosService.remove(+id);
  }
}
