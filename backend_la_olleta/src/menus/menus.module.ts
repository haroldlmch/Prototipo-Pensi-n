import { Module } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { Menu } from './entities/menu.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpcionesMenu } from 'src/opciones-menu/entities/opciones-menu.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, OpcionesMenu])],
  controllers: [MenusController],
  providers: [MenusService],
})
export class MenusModule {}
