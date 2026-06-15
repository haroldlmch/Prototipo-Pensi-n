import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { OpcionesMenu } from './entities/opciones-menu.entity';
import { Menu } from '../menus/entities/menu.entity';

import { CreateOpcionesMenuDto } from './dto/create-opciones-menu.dto';
import { UpdateOpcionesMenuDto } from './dto/update-opciones-menu.dto';

@Injectable()
export class OpcionesMenuService {

constructor(
@InjectRepository(OpcionesMenu)
private readonly opcionesMenuRepository: Repository<OpcionesMenu>,


@InjectRepository(Menu)
private readonly menuRepository: Repository<Menu>,


) {}

async create(
createOpcionesMenuDto: CreateOpcionesMenuDto,
) {


const menu =
  await this.menuRepository.findOne({
    where: {
      id: createOpcionesMenuDto.idMenu,
    },
  });

if (!menu) {
  throw new NotFoundException(
    'Menú no encontrado',
  );
}

const opcionMenu =
  this.opcionesMenuRepository.create({
    nombreSegundo:
      createOpcionesMenuDto.nombreSegundo,
    menu,
  });

return await this.opcionesMenuRepository.save(
  opcionMenu,
);


}

async findAll() {


return await this.opcionesMenuRepository.find({
  relations: {
    menu: true,
  },
  order: {
    id: 'DESC',
  },
});


}

async findOne(id: number) {


const opcionMenu =
  await this.opcionesMenuRepository.findOne({
    where: { id },
    relations: {
      menu: true,
    },
  });

if (!opcionMenu) {
  throw new NotFoundException(
    'Opción de menú no encontrada',
  );
}

return opcionMenu;


}

async update(
  id: number,
  updateOpcionesMenuDto: UpdateOpcionesMenuDto,
) {

  const opcionMenu =
    await this.findOne(id);

  if (updateOpcionesMenuDto.nombreSegundo) {
    opcionMenu.nombreSegundo =
      updateOpcionesMenuDto.nombreSegundo;
  }

  if (updateOpcionesMenuDto.idMenu) {

    const menu =
      await this.menuRepository.findOne({
        where: {
          id: updateOpcionesMenuDto.idMenu,
        },
      });

    if (!menu) {
      throw new NotFoundException(
        'Menú no encontrado',
      );
    }

    opcionMenu.menu = menu;
  }

  return await this.opcionesMenuRepository.save(
    opcionMenu,
  );
}

async remove(id: number) {


await this.findOne(id);

await this.opcionesMenuRepository.delete(id);

return {
  mensaje: 'Opción de menú eliminada',
};


}
}

