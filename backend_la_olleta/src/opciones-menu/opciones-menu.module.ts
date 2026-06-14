import { Module } from '@nestjs/common';
import { OpcionesMenuService } from './opciones-menu.service';
import { OpcionesMenuController } from './opciones-menu.controller';
import { OpcionesMenu } from './entities/opciones-menu.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from 'src/menus/entities/menu.entity';
import { Consumo } from 'src/consumos/entities/consumo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OpcionesMenu, Menu, Consumo])],
  controllers: [OpcionesMenuController],
  providers: [OpcionesMenuService],
})
export class OpcionesMenuModule {}
