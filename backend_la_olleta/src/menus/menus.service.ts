import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Menu } from './entities/menu.entity';

import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenusService {

constructor(
@InjectRepository(Menu)
private readonly menuRepository: Repository<Menu>,
) {}

async create(
createMenuDto: CreateMenuDto,
) {


const menu =
  this.menuRepository.create(
    createMenuDto,
  );

return await this.menuRepository.save(
  menu,
);


}

async findAll() {


return await this.menuRepository.find({
  order: {
    fecha: 'DESC',
  },
});


}

async findOne(id: number) {


const menu =
  await this.menuRepository.findOne({
    where: { id },
    relations: {
      opcionesMenu: true,
    },
  });

if (!menu) {
  throw new NotFoundException(
    'Menú no encontrado',
  );
}

return menu;


}

async update(
id: number,
updateMenuDto: UpdateMenuDto,
) {


const menu =
  await this.findOne(id);

Object.assign(
  menu,
  updateMenuDto,
);

return await this.menuRepository.save(
  menu,
);


}

async remove(id: number) {


await this.findOne(id);

await this.menuRepository.delete(id);

return {
  mensaje: 'Menú eliminado',
};


}
}

