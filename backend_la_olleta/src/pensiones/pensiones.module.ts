import { Module } from '@nestjs/common';
import { PensionesService } from './pensiones.service';
import { PensionesController } from './pensiones.controller';
import { Pensionado } from 'src/pensionados/entities/pensionado.entity';
import { Pensione } from './entities/pensione.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consumo } from 'src/consumos/entities/consumo.entity';
import { Extra } from 'src/extras/entities/extra.entity';
import { Pago } from 'src/pagos/entities/pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pensione, Pensionado, Pago, Consumo, Extra])],
  controllers: [PensionesController],
  providers: [PensionesService],
})
export class PensionesModule {}

