import {
Injectable,
NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Extra } from './entities/extra.entity';
import { Pensione } from '../pensiones/entities/pensione.entity';

import { CreateExtraDto } from './dto/create-extra.dto';
import { UpdateExtraDto } from './dto/update-extra.dto';

@Injectable()
export class ExtrasService {

constructor(
@InjectRepository(Extra)
private readonly extraRepository: Repository<Extra>,


@InjectRepository(Pensione)
private readonly pensionRepository: Repository<Pensione>,


) {}

async create(
createExtraDto: CreateExtraDto,
) {


const pension =
  await this.pensionRepository.findOne({
    where: {
      id: createExtraDto.idPension,
    },
  });

if (!pension) {
  throw new NotFoundException(
    'Pensión no encontrada',
  );
}

const extra =
  this.extraRepository.create({
    fecha:
      new Date(createExtraDto.fecha),

    descripcion:
      createExtraDto.descripcion,

    precio:
      createExtraDto.precio,

    pension,
  });

return await this.extraRepository.save(
  extra,
);


}

async findAll() {


return await this.extraRepository.find({
  relations: {
    pension: {
      pensionado: true,
    },
  },
  order: {
    id: 'DESC',
  },
});


}

async findOne(id: number) {


const extra =
  await this.extraRepository.findOne({
    where: { id },
    relations: {
      pension: {
        pensionado: true,
      },
    },
  });

if (!extra) {
  throw new NotFoundException(
    'Extra no encontrado',
  );
}

return extra;


}

async update(
id: number,
updateExtraDto: UpdateExtraDto,
) {


const extra =
  await this.findOne(id);

if (updateExtraDto.fecha) {
  extra.fecha = new Date(
    updateExtraDto.fecha,
  );
}

if (updateExtraDto.descripcion) {
  extra.descripcion =
    updateExtraDto.descripcion;
}

if (updateExtraDto.precio !== undefined) {
  extra.precio = updateExtraDto.precio;
}

if (updateExtraDto.idPension) {
  const pension =
    await this.pensionRepository.findOne({
      where: {
        id: updateExtraDto.idPension,
      },
    });

  if (!pension) {
    throw new NotFoundException(
      'Pensión no encontrada',
    );
  }

  extra.pension = pension;
}

return await this.extraRepository.save(
  extra,
);


}

async remove(id: number) {


await this.findOne(id);

await this.extraRepository.delete(id);

return {
  mensaje: 'Extra eliminado',
};


}
}

