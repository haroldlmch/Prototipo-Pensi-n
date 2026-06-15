import {
Injectable,
NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { VentasCasuale } from './entities/ventas-casuale.entity';

import { CreateVentasCasualeDto } from './dto/create-ventas-casuale.dto';
import { UpdateVentasCasualeDto } from './dto/update-ventas-casuale.dto';

@Injectable()
export class VentasCasualesService {

constructor(
@InjectRepository(VentasCasuale)
private readonly ventasCasualesRepository: Repository<VentasCasuale>,
) {}

async create(
createVentasCasualeDto: CreateVentasCasualeDto,
) {


const venta =
  this.ventasCasualesRepository.create({
    ...createVentasCasualeDto,
    fecha: new Date(
      createVentasCasualeDto.fecha,
    ),
  });

return await this.ventasCasualesRepository.save(
  venta,
);


}

async findAll() {


return await this.ventasCasualesRepository.find({
  order: {
    id: 'DESC',
  },
});


}

async findOne(id: number) {


const venta =
  await this.ventasCasualesRepository.findOne({
    where: { id },
  });

if (!venta) {
  throw new NotFoundException(
    'Venta casual no encontrada',
  );
}

return venta;


}

async update(
id: number,
updateVentasCasualeDto: UpdateVentasCasualeDto,
) {


const venta =
  await this.findOne(id);

if (updateVentasCasualeDto.fecha) {
  venta.fecha = new Date(
    updateVentasCasualeDto.fecha,
  );
}

if (
  updateVentasCasualeDto.cantidadCompletos !==
  undefined
) {
  venta.cantidadCompletos =
    updateVentasCasualeDto.cantidadCompletos;
}

if (
  updateVentasCasualeDto.precioUnitario !==
  undefined
) {
  venta.precioUnitario =
    updateVentasCasualeDto.precioUnitario;
}

if (
  updateVentasCasualeDto.montoTotal !==
  undefined
) {
  venta.montoTotal =
    updateVentasCasualeDto.montoTotal;
}

return await this.ventasCasualesRepository.save(
  venta,
);


}

async remove(id: number) {


await this.findOne(id);

await this.ventasCasualesRepository.delete(id);

return {
  mensaje: 'Venta casual eliminada',
};


}
}

