import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

import { Pensionado } from '../pensionados/entities/pensionado.entity';
import { Pensione } from '../pensiones/entities/pensione.entity';
import { Consumo } from '../consumos/entities/consumo.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { VentasCasuale } from '../ventas-casuales/entities/ventas-casuale.entity';

import { Extra } from '../extras/entities/extra.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pensionado,
      Pensione,
      Consumo,
      Pago,
      VentasCasuale,
      Extra,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
