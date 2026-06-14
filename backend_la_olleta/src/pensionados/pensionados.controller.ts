import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PensionadosService } from './pensionados.service';
import { CreatePensionadoDto } from './dto/create-pensionado.dto';
import { UpdatePensionadoDto } from './dto/update-pensionado.dto';

@Controller('pensionados')
export class PensionadosController {
  constructor(private readonly pensionadosService: PensionadosService) {}

  @Post()
  create(@Body() createPensionadoDto: CreatePensionadoDto) {
    return this.pensionadosService.create(createPensionadoDto);
  }

  @Get()
  findAll() {
    return this.pensionadosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pensionadosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePensionadoDto: UpdatePensionadoDto) {
    return this.pensionadosService.update(+id, updatePensionadoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pensionadosService.remove(+id);
  }
}
