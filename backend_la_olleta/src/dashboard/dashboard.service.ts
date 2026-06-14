import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Pensionado } from '../pensionados/entities/pensionado.entity';
import { Pensione } from '../pensiones/entities/pensione.entity';
import { Consumo } from '../consumos/entities/consumo.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { VentasCasuale } from '../ventas-casuales/entities/ventas-casuale.entity';

@Injectable()
export class DashboardService {

  constructor(
    @InjectRepository(Pensionado)
    private pensionadoRepository: Repository<Pensionado>,

    @InjectRepository(Pensione)
    private pensionRepository: Repository<Pensione>,

    @InjectRepository(Consumo)
    private consumoRepository: Repository<Consumo>,

    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,

    @InjectRepository(VentasCasuale)
    private ventaRepository: Repository<VentasCasuale>,
  ) {}

  async resumen() {

    const pensionadosActivos =
      await this.pensionadoRepository.count({
        where: {
          estado: true,
        },
      });

    const pensionesActivas =
      await this.pensionRepository.count({
        where: {
          estado: 'ACTIVA',
        },
      });

    const consumosRegistrados =
      await this.consumoRepository.count();

    const ventasCasuales =
      await this.ventaRepository.count();

    return {
      pensionadosActivos,
      pensionesActivas,
      consumosRegistrados,
      ventasCasuales,
    };
  }

  async ultimosConsumos() {

    return await this.consumoRepository.find({
      take: 10,
      order: {
        id: 'DESC',
      },
      relations: {
        pension: true,
        opcionMenu: true,
      },
    });
  }

  async ultimosPagos() {

    return await this.pagoRepository.find({
      take: 10,
      order: {
        id: 'DESC',
      },
      relations: {
        pension: true,
      },
    });
  }

  async alertas() {

    const pensiones =
      await this.pensionRepository.find({
        relations: {
          pensionado: true,
        },
      });

    return pensiones.filter(
      (p) => p.completosDisponibles <= 5,
    );
  }
}
