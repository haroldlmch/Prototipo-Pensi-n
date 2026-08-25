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

    // Actualizar y recargar la pensión con la cantidad de platos indicada
    const nuevaCantidad =
      createPagoDto.cantidadCompletos && createPagoDto.cantidadCompletos > 0
        ? createPagoDto.cantidadCompletos
        : pension.cantidadCompletos;

    pension.cantidadCompletos = nuevaCantidad;
    pension.completosDisponibles = nuevaCantidad;
    pension.estado = 'ACTIVA';
    await this.pensionRepository.save(pension);

    const pago =
      this.pagoRepository.create({
        fechaPago:
          createPagoDto.fechaPago.slice(0, 10) as any,

        precioUnitario:
          createPagoDto.precioUnitario,

        cantidadCompletos:
          nuevaCantidad,

        montoTotal:
          createPagoDto.montoTotal,

        metodoPago:
          createPagoDto.metodoPago || 'Efectivo',

        pension,
      });

    return await this.pagoRepository.save(
      pago,
    );
  }

  async findAll() {
    return await this.pagoRepository.find({
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
    const pago = await this.pagoRepository.findOne({
      where: { id },
      relations: {
        pension: {
          pensionado: true,
        },
      },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    return pago;
  }

  async update(id: number, updatePagoDto: UpdatePagoDto) {
    const pago = await this.findOne(id);

    if (updatePagoDto.fechaPago) {
      pago.fechaPago = updatePagoDto.fechaPago.slice(0, 10) as any;
    }
    if (updatePagoDto.precioUnitario !== undefined) {
      pago.precioUnitario = updatePagoDto.precioUnitario;
    }
    if (updatePagoDto.montoTotal !== undefined) {
      pago.montoTotal = updatePagoDto.montoTotal;
    }
    if (updatePagoDto.metodoPago) {
      pago.metodoPago = updatePagoDto.metodoPago;
    }

    return await this.pagoRepository.save(pago);
  }

async remove(id: number) {


await this.findOne(id);

await this.pagoRepository.delete(id);

return {
  mensaje: 'Pago eliminado',
};


}
}

