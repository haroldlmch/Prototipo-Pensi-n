import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { OpcionesMenu } from 'src/opciones-menu/entities/opciones-menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(OpcionesMenu)
    private readonly opcionMenuRepository: Repository<OpcionesMenu>,
  ) {}

  async create(createMenuDto: CreateMenuDto) {
    const { opciones, ...menuData } = createMenuDto;

    const menu = this.menuRepository.create({
      fecha: menuData.fecha.slice(0, 10) as any,
      sopa: menuData.sopa,
    });

    const guardado = await this.menuRepository.save(menu);

    if (opciones && opciones.length > 0) {
      const entidadesOpciones = opciones
        .filter((op) => op.trim().length > 0)
        .map((nombreSegundo) =>
          this.opcionMenuRepository.create({
            nombreSegundo: nombreSegundo.trim(),
            menu: guardado,
          }),
        );
      await this.opcionMenuRepository.save(entidadesOpciones);
    }

    return await this.findOne(guardado.id);
  }

  async findAll() {
    return await this.menuRepository.find({
      relations: {
        opcionesMenu: true,
      },
      order: {
        fecha: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const menu = await this.menuRepository.findOne({
      where: { id },
      relations: {
        opcionesMenu: true,
      },
    });

    if (!menu) {
      throw new NotFoundException('Menú no encontrado');
    }

    return menu;
  }

  async findByFecha(fecha: string) {
    return await this.menuRepository.findOne({
      where: { fecha: fecha.slice(0, 10) as any },
      relations: {
        opcionesMenu: true,
      },
    });
  }

  async update(id: number, updateMenuDto: UpdateMenuDto) {
    const menu = await this.findOne(id);
    const { opciones, ...menuData } = updateMenuDto;

    if (menuData.fecha) {
      menu.fecha = menuData.fecha.slice(0, 10) as any;
    }
    if (menuData.sopa) {
      menu.sopa = menuData.sopa;
    }

    await this.menuRepository.save(menu);

    if (opciones !== undefined) {
      // Eliminar opciones anteriores que no estén en la nueva lista o reemplazarlas limpiamente
      await this.opcionMenuRepository.delete({ menu: { id: menu.id } });
      const nuevasOpciones = opciones
        .filter((op) => op.trim().length > 0)
        .map((nombreSegundo) =>
          this.opcionMenuRepository.create({
            nombreSegundo: nombreSegundo.trim(),
            menu,
          }),
        );
      if (nuevasOpciones.length > 0) {
        await this.opcionMenuRepository.save(nuevasOpciones);
      }
    }

    return await this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.menuRepository.delete(id);
    return {
      mensaje: 'Menú eliminado',
    };
  }
}

