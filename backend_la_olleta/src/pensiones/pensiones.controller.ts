import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PensionesService } from './pensiones.service';
import { CreatePensioneDto } from './dto/create-pensione.dto';
import { UpdatePensioneDto } from './dto/update-pensione.dto';

@Controller('pensiones')
export class PensionesController {
  constructor(private readonly pensionesService: PensionesService) {}

  @Post()
  create(@Body() createPensioneDto: CreatePensioneDto) {
    return this.pensionesService.create(createPensioneDto);
  }

  @Get()
  findAll() {
    return this.pensionesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pensionesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePensioneDto: UpdatePensioneDto) {
    return this.pensionesService.update(+id, updatePensioneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pensionesService.remove(+id);
  }
}
