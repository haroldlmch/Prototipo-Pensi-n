import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Pago } from './entities/pago.entity';
import { Pensione } from '../pensiones/entities/pensione.entity';

import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';

@Injectable()
export class PagosService {

constructor(
@InjectRepository(Pago)
private readonly pagoRepository: Repository<Pago>,


@InjectRepository(Pensione)
private readonly pensionRepository: Repository<Pensione>,


) {}

async create(
createPagoDto: CreatePagoDto,
) {


const pension =
  await this.pensionRepository.findOne({
    where: {
      id: createPagoDto.idPension,
    },
  });

if (!pension) {
  throw new NotFoundException(
    'Pensión no encontrada',
  );
}

const pago =
  this.pagoRepository.create({
    fechaPago:
      new Date(createPagoDto.fechaPago),

    precioUnitario:
      createPagoDto.precioUnitario,

    montoTotal:
      createPagoDto.montoTotal,

    pension,
  });

return await this.pagoRepository.save(
  pago,
);


}

async findAll() {


return await this.pagoRepository.find({
  relations: {
    pension: true,
  },
  order: {
    id: 'DESC',
  },
});


}

async findOne(id: number) {


const pago =
  await this.pagoRepository.findOne({
    where: { id },
    relations: {
      pension: true,
    },
  });

if (!pago) {
  throw new NotFoundException(
    'Pago no encontrado',
  );
}

return pago;


}

async update(
id: number,
updatePagoDto: UpdatePagoDto,
) {


const pago =
  await this.findOne(id);

Object.assign(
  pago,
  updatePagoDto,
);

return await this.pagoRepository.save(
  pago,
);


}

async remove(id: number) {


await this.findOne(id);

await this.pagoRepository.delete(id);

return {
  mensaje: 'Pago eliminado',
};


}
}

