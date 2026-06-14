import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VentasCasualesService } from './ventas-casuales.service';
import { CreateVentasCasualeDto } from './dto/create-ventas-casuale.dto';
import { UpdateVentasCasualeDto } from './dto/update-ventas-casuale.dto';

@Controller('ventas-casuales')
export class VentasCasualesController {
  constructor(private readonly ventasCasualesService: VentasCasualesService) {}

  @Post()
  create(@Body() createVentasCasualeDto: CreateVentasCasualeDto) {
    return this.ventasCasualesService.create(createVentasCasualeDto);
  }

  @Get()
  findAll() {
    return this.ventasCasualesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ventasCasualesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVentasCasualeDto: UpdateVentasCasualeDto) {
    return this.ventasCasualesService.update(+id, updateVentasCasualeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ventasCasualesService.remove(+id);
  }
}
