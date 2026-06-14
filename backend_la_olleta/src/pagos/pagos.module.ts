import { Module } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './entities/pago.entity';
import { Pensione } from 'src/pensiones/entities/pensione.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Pensione])],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}
