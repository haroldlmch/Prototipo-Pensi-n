import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { VentasCasuale } from './entities/ventas-casuale.entity';
import { OpcionesMenu } from '../opciones-menu/entities/opciones-menu.entity';
import { Menu } from '../menus/entities/menu.entity';
import { CreateVentasCasualeDto } from './dto/create-ventas-casuale.dto';
import { UpdateVentasCasualeDto } from './dto/update-ventas-casuale.dto';

@Injectable()
export class VentasCasualesService {
  constructor(
    @InjectRepository(VentasCasuale)
    private readonly ventasCasualesRepository: Repository<VentasCasuale>,

    @InjectRepository(OpcionesMenu)
    private readonly opcionMenuRepository: Repository<OpcionesMenu>,

    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async create(createVentasCasualeDto: CreateVentasCasualeDto) {
    const fechaLimpia = createVentasCasualeDto.fecha.slice(0, 10);
    const items = createVentasCasualeDto.items;

    // Caso A: Venta con múltiples ítems en una sola factura
    if (items && Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        const cant = Number(it.cantidad) || 1;
        const tipo = it.tipoPlato || 'Completo';

        if (it.idOpcionMenu && (tipo === 'Completo' || tipo === 'Solo Segundo')) {
          const opc = await this.opcionMenuRepository.findOne({ where: { id: it.idOpcionMenu } });
          if (opc && opc.cantidadDisponible !== null && opc.cantidadDisponible !== undefined) {
            opc.cantidadDisponible = Math.max(0, opc.cantidadDisponible - cant);
            await this.opcionMenuRepository.save(opc);
          }
        }

        if (tipo === 'Completo' || tipo === 'Solo Sopa') {
          const menuFecha = await this.menuRepository.findOne({
            where: { fecha: fechaLimpia as any },
          });
          if (menuFecha && menuFecha.cantidadSopaDisponible !== null && menuFecha.cantidadSopaDisponible !== undefined) {
            menuFecha.cantidadSopaDisponible = Math.max(0, menuFecha.cantidadSopaDisponible - cant);
            await this.menuRepository.save(menuFecha);
          }
        }
      }

      let opcionMenuPrincipal: OpcionesMenu | undefined = undefined;
      const primerItemConOpc = items.find((i) => i.idOpcionMenu);
      if (primerItemConOpc?.idOpcionMenu) {
        const encontrada = await this.opcionMenuRepository.findOne({ where: { id: primerItemConOpc.idOpcionMenu } });
        if (encontrada) opcionMenuPrincipal = encontrada;
      }

      const venta = this.ventasCasualesRepository.create({
        ...createVentasCasualeDto,
        fecha: fechaLimpia as any,
        tipoPlato: createVentasCasualeDto.tipoPlato || 'Completo',
        opcionMenu: opcionMenuPrincipal,
        detalleItems: createVentasCasualeDto.detalleItems || JSON.stringify(items),
      });

      return await this.ventasCasualesRepository.save(venta);
    }

    // Caso B: Venta simple (compatibilidad)
    let opcionMenu: OpcionesMenu | undefined = undefined;
    const tipo = createVentasCasualeDto.tipoPlato || 'Completo';

    if (createVentasCasualeDto.idOpcionMenu) {
      const encontrada = await this.opcionMenuRepository.findOne({
        where: { id: createVentasCasualeDto.idOpcionMenu },
      });
      if (encontrada) {
        opcionMenu = encontrada;
        if (
          (tipo === 'Completo' || tipo === 'Solo Segundo') &&
          opcionMenu.cantidadDisponible !== null &&
          opcionMenu.cantidadDisponible !== undefined
        ) {
          opcionMenu.cantidadDisponible = Math.max(
            0,
            opcionMenu.cantidadDisponible - createVentasCasualeDto.cantidadCompletos,
          );
          await this.opcionMenuRepository.save(opcionMenu);
        }
      }
    }

    // Descontar Sopa si aplica
    if (tipo === 'Completo' || tipo === 'Solo Sopa') {
      const menuFecha = await this.menuRepository.findOne({
        where: { fecha: fechaLimpia as any },
      });
      if (
        menuFecha &&
        menuFecha.cantidadSopaDisponible !== null &&
        menuFecha.cantidadSopaDisponible !== undefined
      ) {
        menuFecha.cantidadSopaDisponible = Math.max(
          0,
          menuFecha.cantidadSopaDisponible - createVentasCasualeDto.cantidadCompletos,
        );
        await this.menuRepository.save(menuFecha);
      }
    }

    const venta = this.ventasCasualesRepository.create({
      ...createVentasCasualeDto,
      fecha: fechaLimpia as any,
      tipoPlato: tipo,
      opcionMenu,
    });

    return await this.ventasCasualesRepository.save(venta);
  }

  async findAll() {
    return await this.ventasCasualesRepository.find({
      relations: {
        opcionMenu: true,
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const venta = await this.ventasCasualesRepository.findOne({
      where: { id },
      relations: {
        opcionMenu: true,
      },
    });

    if (!venta) {
      throw new NotFoundException('Venta casual no encontrada');
    }

    return venta;
  }

  async update(id: number, updateVentasCasualeDto: UpdateVentasCasualeDto) {
    const venta = await this.findOne(id);

    if (updateVentasCasualeDto.fecha) {
      venta.fecha = updateVentasCasualeDto.fecha.slice(0, 10) as any;
    }

    if (updateVentasCasualeDto.cantidadCompletos !== undefined) {
      venta.cantidadCompletos = updateVentasCasualeDto.cantidadCompletos;
    }

    if (updateVentasCasualeDto.tipoPlato !== undefined) {
      venta.tipoPlato = updateVentasCasualeDto.tipoPlato;
    }

    if (updateVentasCasualeDto.precioUnitario !== undefined) {
      venta.precioUnitario = updateVentasCasualeDto.precioUnitario;
    }

    if (updateVentasCasualeDto.montoTotal !== undefined) {
      venta.montoTotal = updateVentasCasualeDto.montoTotal;
    }

    if (updateVentasCasualeDto.metodoPago) {
      venta.metodoPago = updateVentasCasualeDto.metodoPago;
    }

    if (updateVentasCasualeDto.detalleItems !== undefined) {
      venta.detalleItems = updateVentasCasualeDto.detalleItems;
    }

    if (updateVentasCasualeDto.idOpcionMenu !== undefined) {
      venta.opcionMenu = updateVentasCasualeDto.idOpcionMenu
        ? ({ id: updateVentasCasualeDto.idOpcionMenu } as any)
        : undefined;
    }

    return await this.ventasCasualesRepository.save(venta);
  }

  async remove(id: number) {
    const venta = await this.findOne(id);
    const fechaLimpia = (venta.fecha as any instanceof Date)
      ? (venta.fecha as any).toISOString().slice(0, 10)
      : String(venta.fecha).slice(0, 10);

    if (venta.detalleItems) {
      try {
        const items = JSON.parse(venta.detalleItems);
        if (Array.isArray(items)) {
          for (const it of items) {
            const cant = Number(it.cantidad) || 1;
            const tipo = it.tipoPlato || 'Completo';

            if (it.idOpcionMenu && (tipo === 'Completo' || tipo === 'Solo Segundo')) {
              const opc = await this.opcionMenuRepository.findOne({ where: { id: it.idOpcionMenu } });
              if (opc && opc.cantidadDisponible !== null && opc.cantidadDisponible !== undefined) {
                opc.cantidadDisponible += cant;
                await this.opcionMenuRepository.save(opc);
              }
            }

            if (tipo === 'Completo' || tipo === 'Solo Sopa') {
              const menuFecha = await this.menuRepository.findOne({ where: { fecha: fechaLimpia as any } });
              if (menuFecha && menuFecha.cantidadSopaDisponible !== null && menuFecha.cantidadSopaDisponible !== undefined) {
                menuFecha.cantidadSopaDisponible += cant;
                await this.menuRepository.save(menuFecha);
              }
            }
          }
        }
      } catch (e) {
        // Fallback
      }
    } else {
      if (
        venta.opcionMenu &&
        venta.opcionMenu.cantidadDisponible !== null &&
        venta.opcionMenu.cantidadDisponible !== undefined
      ) {
        venta.opcionMenu.cantidadDisponible += venta.cantidadCompletos;
        await this.opcionMenuRepository.save(venta.opcionMenu);
      }

      const tipo = venta.tipoPlato || 'Completo';
      if (tipo === 'Completo' || tipo === 'Solo Sopa') {
        const menuFecha = await this.menuRepository.findOne({
          where: { fecha: fechaLimpia as any },
        });
        if (menuFecha && menuFecha.cantidadSopaDisponible !== null && menuFecha.cantidadSopaDisponible !== undefined) {
          menuFecha.cantidadSopaDisponible += venta.cantidadCompletos;
          await this.menuRepository.save(menuFecha);
        }
      }
    }

    await this.ventasCasualesRepository.delete(id);
    return {
      mensaje: 'Venta casual eliminada',
    };
  }
}
