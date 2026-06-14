import { Module } from '@nestjs/common';
import { PensionadosService } from './pensionados.service';
import { PensionadosController } from './pensionados.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pensionado } from './entities/pensionado.entity';
import { Pensione } from 'src/pensiones/entities/pensione.entity';
import { Pago } from 'src/pagos/entities/pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pensionado, Pensione, Pago])],
  controllers: [PensionadosController],
  providers: [PensionadosService],
})
export class PensionadosModule {}
