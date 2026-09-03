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

    const cantSopaIni = Number(menuData.cantidadSopaInicial) || 0;
    const cantSopaDisp =
      menuData.cantidadSopaDisponible !== undefined && Number(menuData.cantidadSopaDisponible) > 0
        ? Number(menuData.cantidadSopaDisponible)
        : cantSopaIni;

    const menu = this.menuRepository.create({
      fecha: menuData.fecha.slice(0, 10) as any,
      sopa: menuData.sopa,
      cantidadSopaInicial: cantSopaIni,
      cantidadSopaDisponible: cantSopaDisp,
    });

    const guardado = await this.menuRepository.save(menu);

    if (opciones && opciones.length > 0) {
      const entidadesOpciones = opciones
        .map((op) => {
          if (typeof op === 'string') {
            const trimmed = op.trim();
            if (!trimmed) return null;
            return this.opcionMenuRepository.create({
              nombreSegundo: trimmed,
              cantidadInicial: 0,
              cantidadDisponible: 0,
              menu: guardado,
            });
          } else if (op && typeof op === 'object' && op.nombreSegundo) {
            const trimmed = String(op.nombreSegundo).trim();
            if (!trimmed) return null;
            const cIni = Number(op.cantidadInicial) || 0;
            const cDisp =
              op.cantidadDisponible !== undefined && Number(op.cantidadDisponible) > 0
                ? Number(op.cantidadDisponible)
                : cIni;
            return this.opcionMenuRepository.create({
              nombreSegundo: trimmed,
              cantidadInicial: cIni,
              cantidadDisponible: cDisp,
              menu: guardado,
            });
          }
          return null;
        })
        .filter((op): op is OpcionesMenu => op !== null);

      if (entidadesOpciones.length > 0) {
        await this.opcionMenuRepository.save(entidadesOpciones);
      }
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
    if (menuData.cantidadSopaInicial !== undefined) {
      menu.cantidadSopaInicial = Number(menuData.cantidadSopaInicial) || 0;
    }
    if (menuData.cantidadSopaDisponible !== undefined) {
      menu.cantidadSopaDisponible = Number(menuData.cantidadSopaDisponible) || 0;
    }

    await this.menuRepository.save(menu);

    if (opciones !== undefined) {
      // Eliminar opciones anteriores y guardar las nuevas limpiamente
      await this.opcionMenuRepository.delete({ menu: { id: menu.id } });
      const nuevasOpciones = opciones
        .map((op) => {
          if (typeof op === 'string') {
            const trimmed = op.trim();
            if (!trimmed) return null;
            return this.opcionMenuRepository.create({
              nombreSegundo: trimmed,
              cantidadInicial: 0,
              cantidadDisponible: 0,
              menu,
            });
          } else if (op && typeof op === 'object' && op.nombreSegundo) {
            const trimmed = String(op.nombreSegundo).trim();
            if (!trimmed) return null;
            const cIni = Number(op.cantidadInicial) || 0;
            let cDisp =
              op.cantidadDisponible !== undefined && op.cantidadDisponible !== null
                ? Number(op.cantidadDisponible)
                : cIni;
            if (cDisp > cIni) cDisp = cIni;
            if (cIni > 0 && cDisp === 0 && (op.cantidadDisponible === undefined || op.cantidadDisponible === null)) {
              cDisp = cIni;
            }
            return this.opcionMenuRepository.create({
              nombreSegundo: trimmed,
              cantidadInicial: cIni,
              cantidadDisponible: cDisp,
              menu,
            });
          }
          return null;
        })
        .filter((op): op is OpcionesMenu => op !== null);

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

