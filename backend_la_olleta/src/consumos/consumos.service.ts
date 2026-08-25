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

  async create(createConsumoDto: CreateConsumoDto) {
    const pension = await this.pensionRepository.findOne({
      where: { id: createConsumoDto.idPension },
    });

    if (!pension) {
      throw new NotFoundException('Pensión no encontrada');
    }

    const opcionMenu = await this.opcionMenuRepository.findOne({
      where: { id: createConsumoDto.idOpcionMenu },
    });

    if (!opcionMenu) {
      throw new NotFoundException('Opción de menú no encontrada');
    }

    if (pension.completosDisponibles < createConsumoDto.cantidadCompletos) {
      throw new BadRequestException('No existen completos suficientes');
    }

    pension.completosDisponibles -= createConsumoDto.cantidadCompletos;

    if (pension.completosDisponibles <= 0) {
      pension.estado = 'AGOTADA';
    } else {
      pension.estado = 'ACTIVA';
    }

    await this.pensionRepository.save(pension);

    const fechaLimpia = createConsumoDto.fecha.slice(0, 10);

    const consumo = this.consumoRepository.create({
      fecha: fechaLimpia as any,
      cantidadCompletos: createConsumoDto.cantidadCompletos,
      tipoConsumo: createConsumoDto.tipoConsumo,
      pension,
      opcionMenu,
    });

    return await this.consumoRepository.save(consumo);
  }

  async findAll() {
    return await this.consumoRepository.find({
      relations: {
        pension: {
          pensionado: true,
        },
        opcionMenu: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const consumo = await this.consumoRepository.findOne({
      where: { id },
      relations: {
        pension: {
          pensionado: true,
        },
        opcionMenu: true,
      },
    });

    if (!consumo) {
      throw new NotFoundException('Consumo no encontrado');
    }

    return consumo;
  }

  async update(id: number, updateConsumoDto: UpdateConsumoDto) {
    const consumo = await this.findOne(id);
    const pensionAnterior = consumo.pension;
    let nuevaPension = pensionAnterior;

    if (
      updateConsumoDto.idPension &&
      updateConsumoDto.idPension !== pensionAnterior.id
    ) {
      const pensionEncontrada = await this.pensionRepository.findOne({
        where: { id: updateConsumoDto.idPension },
      });

      if (!pensionEncontrada) {
        throw new NotFoundException('Pensión no encontrada');
      }

      nuevaPension = pensionEncontrada;
    }

    const nuevaCantidad =
      updateConsumoDto.cantidadCompletos ?? consumo.cantidadCompletos;

    let nuevaOpcionMenu = consumo.opcionMenu;

    if (updateConsumoDto.idOpcionMenu) {
      const opcionMenu = await this.opcionMenuRepository.findOne({
        where: { id: updateConsumoDto.idOpcionMenu },
      });

      if (!opcionMenu) {
        throw new NotFoundException('Opción de menú no encontrada');
      }

      nuevaOpcionMenu = opcionMenu;
    }

    if (nuevaPension.id === pensionAnterior.id) {
      const disponiblesConDevolucion =
        pensionAnterior.completosDisponibles + consumo.cantidadCompletos;

      if (disponiblesConDevolucion < nuevaCantidad) {
        throw new BadRequestException('No existen completos suficientes');
      }

      pensionAnterior.completosDisponibles =
        disponiblesConDevolucion - nuevaCantidad;
      pensionAnterior.estado =
        pensionAnterior.completosDisponibles <= 0 ? 'AGOTADA' : 'ACTIVA';

      await this.pensionRepository.save(pensionAnterior);
    } else {
      if (nuevaPension.completosDisponibles < nuevaCantidad) {
        throw new BadRequestException('No existen completos suficientes');
      }

      pensionAnterior.completosDisponibles += consumo.cantidadCompletos;
      pensionAnterior.estado =
        pensionAnterior.completosDisponibles <= 0 ? 'AGOTADA' : 'ACTIVA';

      nuevaPension.completosDisponibles -= nuevaCantidad;
      nuevaPension.estado =
        nuevaPension.completosDisponibles <= 0 ? 'AGOTADA' : 'ACTIVA';

      await this.pensionRepository.save([pensionAnterior, nuevaPension]);
    }

    if (updateConsumoDto.fecha) {
      consumo.fecha = updateConsumoDto.fecha.slice(0, 10) as any;
    }

    if (updateConsumoDto.tipoConsumo) {
      consumo.tipoConsumo = updateConsumoDto.tipoConsumo;
    }

    consumo.cantidadCompletos = nuevaCantidad;
    consumo.pension = nuevaPension;
    consumo.opcionMenu = nuevaOpcionMenu;

    return await this.consumoRepository.save(consumo);
  }

  async remove(id: number) {
    const consumo = await this.findOne(id);

    consumo.pension.completosDisponibles += consumo.cantidadCompletos;
    consumo.pension.estado =
      consumo.pension.completosDisponibles <= 0 ? 'AGOTADA' : 'ACTIVA';

    await this.pensionRepository.save(consumo.pension);

    await this.consumoRepository.delete(id);

    return {
      mensaje: 'Consumo eliminado',
    };
  }
}
