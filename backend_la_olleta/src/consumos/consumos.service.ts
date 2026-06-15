import {
Injectable,
NotFoundException,
BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Consumo } from './entities/consumo.entity';
import { Pensione } from '../pensiones/entities/pensione.entity';
import { OpcionesMenu } from '../opciones-menu/entities/opciones-menu.entity';

import { CreateConsumoDto } from './dto/create-consumo.dto';
import { UpdateConsumoDto } from './dto/update-consumo.dto';

@Injectable()
export class ConsumosService {

constructor(
@InjectRepository(Consumo)
private readonly consumoRepository: Repository<Consumo>,


@InjectRepository(Pensione)
private readonly pensionRepository: Repository<Pensione>,

@InjectRepository(OpcionesMenu)
private readonly opcionMenuRepository: Repository<OpcionesMenu>,


) {}

async create(
createConsumoDto: CreateConsumoDto,
) {


const pension =
  await this.pensionRepository.findOne({
    where: {
      id: createConsumoDto.idPension,
    },
  });

if (!pension) {
  throw new NotFoundException(
    'Pensión no encontrada',
  );
}

const opcionMenu =
  await this.opcionMenuRepository.findOne({
    where: {
      id: createConsumoDto.idOpcionMenu,
    },
  });

if (!opcionMenu) {
  throw new NotFoundException(
    'Opción de menú no encontrada',
  );
}

if (
  pension.completosDisponibles <
  createConsumoDto.cantidadCompletos
) {
  throw new BadRequestException(
    'No existen completos suficientes',
  );
}

pension.completosDisponibles -=
  createConsumoDto.cantidadCompletos;

await this.pensionRepository.save(
  pension,
);

const consumo =
  this.consumoRepository.create({
    fecha:
      new Date(createConsumoDto.fecha),

    cantidadCompletos:
      createConsumoDto.cantidadCompletos,

    tipoConsumo:
      createConsumoDto.tipoConsumo,

    pension,
    opcionMenu,
  });

return await this.consumoRepository.save(
  consumo,
);


}

async findAll() {


return await this.consumoRepository.find({
  relations: {
    pension: true,
    opcionMenu: true,
  },
  order: {
    id: 'DESC',
  },
});


}

async findOne(id: number) {


const consumo =
  await this.consumoRepository.findOne({
    where: { id },
    relations: {
      pension: true,
      opcionMenu: true,
    },
  });

if (!consumo) {
  throw new NotFoundException(
    'Consumo no encontrado',
  );
}

return consumo;


}

async update(
id: number,
updateConsumoDto: UpdateConsumoDto,
) {


const consumo =
  await this.findOne(id);

const pensionAnterior = consumo.pension;

let nuevaPension = pensionAnterior;

if (
  updateConsumoDto.idPension &&
  updateConsumoDto.idPension !== pensionAnterior.id
) {
  const pensionEncontrada =
    await this.pensionRepository.findOne({
      where: {
        id: updateConsumoDto.idPension,
      },
    });

  if (!pensionEncontrada) {
    throw new NotFoundException(
      'Pensión no encontrada',
    );
  }

  nuevaPension = pensionEncontrada;
}

const nuevaCantidad =
  updateConsumoDto.cantidadCompletos ??
  consumo.cantidadCompletos;

let nuevaOpcionMenu = consumo.opcionMenu;

if (updateConsumoDto.idOpcionMenu) {
  const opcionMenu =
    await this.opcionMenuRepository.findOne({
      where: {
        id: updateConsumoDto.idOpcionMenu,
      },
    });

  if (!opcionMenu) {
    throw new NotFoundException(
      'Opción de menú no encontrada',
    );
  }

  nuevaOpcionMenu = opcionMenu;
}

if (nuevaPension.id === pensionAnterior.id) {
  const disponiblesConDevolucion =
    pensionAnterior.completosDisponibles +
    consumo.cantidadCompletos;

  if (disponiblesConDevolucion < nuevaCantidad) {
    throw new BadRequestException(
      'No existen completos suficientes',
    );
  }

  pensionAnterior.completosDisponibles =
    disponiblesConDevolucion - nuevaCantidad;

  await this.pensionRepository.save(
    pensionAnterior,
  );
} else {
  if (
    nuevaPension.completosDisponibles <
    nuevaCantidad
  ) {
    throw new BadRequestException(
      'No existen completos suficientes',
    );
  }

  pensionAnterior.completosDisponibles +=
    consumo.cantidadCompletos;

  nuevaPension.completosDisponibles -=
    nuevaCantidad;

  await this.pensionRepository.save([
    pensionAnterior,
    nuevaPension,
  ]);
}

if (updateConsumoDto.fecha) {
  consumo.fecha = new Date(
    updateConsumoDto.fecha,
  );
}

if (updateConsumoDto.tipoConsumo) {
  consumo.tipoConsumo =
    updateConsumoDto.tipoConsumo;
}

consumo.cantidadCompletos = nuevaCantidad;
consumo.pension = nuevaPension;
consumo.opcionMenu = nuevaOpcionMenu;

return await this.consumoRepository.save(
  consumo,
);


}

async remove(id: number) {


const consumo = await this.findOne(id);

consumo.pension.completosDisponibles +=
  consumo.cantidadCompletos;

await this.pensionRepository.save(
  consumo.pension,
);

await this.consumoRepository.delete(id);

return {
  mensaje: 'Consumo eliminado',
};


}
}

