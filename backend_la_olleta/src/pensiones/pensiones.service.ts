import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Pensione } from './entities/pensione.entity';
import { Pensionado } from '../pensionados/entities/pensionado.entity';

import { CreatePensioneDto } from './dto/create-pensione.dto';
import { UpdatePensioneDto } from './dto/update-pensione.dto';

@Injectable()
export class PensionesService {

constructor(
@InjectRepository(Pensione)
private readonly pensioneRepository: Repository<Pensione>,


@InjectRepository(Pensionado)
private readonly pensionadoRepository: Repository<Pensionado>,


) {}

async create(
createPensioneDto: CreatePensioneDto,
) {


const pensionado =
  await this.pensionadoRepository.findOne({
    where: {
      id: createPensioneDto.idPensionado,
    },
  });

if (!pensionado) {
  throw new NotFoundException(
    'Pensionado no encontrado',
  );
}

const pension =
  this.pensioneRepository.create({
    fechaInicio:
      createPensioneDto.fechaInicio,

    cantidadCompletos:
      createPensioneDto.cantidadCompletos,

    completosDisponibles:
      createPensioneDto.completosDisponibles,

    estado:
      createPensioneDto.estado,

    pensionado,
  });

return await this.pensioneRepository.save(
  pension,
);


}

async findAll() {


return await this.pensioneRepository.find({
  relations: {
    pensionado: true,
  },
  order: {
    id: 'DESC',
  },
});


}

async findOne(id: number) {


const pension =
  await this.pensioneRepository.findOne({
    where: { id },
    relations: {
      pensionado: true,
      pago: true,
      consumos: true,
      extras: true,
    },
  });

if (!pension) {
  throw new NotFoundException(
    'Pensión no encontrada',
  );
}

return pension;


}

async update(
id: number,
updatePensioneDto: UpdatePensioneDto,
) {


const pension =
  await this.findOne(id);

Object.assign(
  pension,
  updatePensioneDto,
);

return await this.pensioneRepository.save(
  pension,
);


}

async remove(id: number) {


await this.findOne(id);

await this.pensioneRepository.softDelete(
  id,
);

return {
  mensaje: 'Pensión eliminada',
};


}
}

