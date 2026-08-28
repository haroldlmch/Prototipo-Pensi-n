import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(createVentasCasualeDto: CreateVentasCasualeDto) {
    const venta = this.ventasCasualesRepository.create({
      ...createVentasCasualeDto,
      fecha: createVentasCasualeDto.fecha.slice(0, 10) as any,
      opcionMenu: createVentasCasualeDto.idOpcionMenu
        ? ({ id: createVentasCasualeDto.idOpcionMenu } as any)
        : undefined,
    });

    return await this.ventasCasualesRepository.save(venta);
  }

  async findAll() {
    return await this.ventasCasualesRepository.find({
      relations: {
        opcionMenu: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const venta = await this.ventasCasualesRepository.findOne({
      where: { id },
      relations: {
        opcionMenu: true,
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta casual no encontrada');
    }

    return venta;
  }

  async update(id: number, updateVentasCasualeDto: UpdateVentasCasualeDto) {
    const venta = await this.findOne(id);

    if (updateVentasCasualeDto.fecha) {
      venta.fecha = updateVentasCasualeDto.fecha.slice(0, 10) as any;
    }

    if (updateVentasCasualeDto.cantidadCompletos !== undefined) {
      venta.cantidadCompletos = updateVentasCasualeDto.cantidadCompletos;
    }

    if (updateVentasCasualeDto.precioUnitario !== undefined) {
      venta.precioUnitario = updateVentasCasualeDto.precioUnitario;
    }

    if (updateVentasCasualeDto.montoTotal !== undefined) {
      venta.montoTotal = updateVentasCasualeDto.montoTotal;
    }

    if (updateVentasCasualeDto.metodoPago) {
      venta.metodoPago = updateVentasCasualeDto.metodoPago;
    }

    if (updateVentasCasualeDto.idOpcionMenu !== undefined) {
      venta.opcionMenu = updateVentasCasualeDto.idOpcionMenu
        ? ({ id: updateVentasCasualeDto.idOpcionMenu } as any)
        : undefined;
    }

    return await this.ventasCasualesRepository.save(venta);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.ventasCasualesRepository.delete(id);
    return {
      mensaje: 'Venta casual eliminada',
    };
  }
}
