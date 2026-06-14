import { Module } from '@nestjs/common';
import { ConsumosService } from './consumos.service';
import { ConsumosController } from './consumos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consumo } from './entities/consumo.entity';
import { Pensione } from 'src/pensiones/entities/pensione.entity';
import { OpcionesMenu } from 'src/opciones-menu/entities/opciones-menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consumo, Pensione, OpcionesMenu])],
  controllers: [ConsumosController],
  providers: [ConsumosService],
})
export class ConsumosModule {}
