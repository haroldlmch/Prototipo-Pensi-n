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
  this.ventasCasualesRepository.create(
    createVentasCasualeDto,
  );

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

Object.assign(
  venta,
  updateVentasCasualeDto,
);

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

