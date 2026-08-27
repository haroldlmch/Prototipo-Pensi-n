import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';

import { Pensionado } from '../pensionados/entities/pensionado.entity';
import { Pensione } from '../pensiones/entities/pensione.entity';
import { Menu } from '../menus/entities/menu.entity';
import { OpcionesMenu } from '../opciones-menu/entities/opciones-menu.entity';
import { Consumo } from '../consumos/entities/consumo.entity';
import { ConsumosModule } from '../consumos/consumos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pensionado,
      Pensione,
      Menu,
      OpcionesMenu,
      Consumo,
    ]),
    ConsumosModule,
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
