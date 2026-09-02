import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { Pensionado } from '../pensionados/entities/pensionado.entity';
import { Pensione } from '../pensiones/entities/pensione.entity';
import { Consumo } from '../consumos/entities/consumo.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { VentasCasuale } from '../ventas-casuales/entities/ventas-casuale.entity';
import { Extra } from '../extras/entities/extra.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Pensionado)
    private pensionadoRepository: Repository<Pensionado>,

    @InjectRepository(Pensione)
    private pensionRepository: Repository<Pensione>,

    @InjectRepository(Consumo)
    private consumoRepository: Repository<Consumo>,

    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,

    @InjectRepository(VentasCasuale)
    private ventaRepository: Repository<VentasCasuale>,

    @InjectRepository(Extra)
    private extraRepository: Repository<Extra>,
  ) {}

  async resumen() {
    const pensionadosActivos = await this.pensionadoRepository.count({
      where: { estado: true },
    });

    const pensionesActivas = await this.pensionRepository.count({
      where: { estado: 'ACTIVA' },
    });

    const consumosRegistrados = await this.consumoRepository.count();
    const ventasCasuales = await this.ventaRepository.count();

    const todosPagos = await this.pagoRepository.find();
    const totalIngresosPagos = todosPagos.reduce(
      (sum, p) => sum + Number(p.montoTotal || 0),
      0,
    );

    const todasVentas = await this.ventaRepository.find();
    const totalIngresosVentas = todasVentas.reduce(
      (sum, v) => sum + Number(v.montoTotal || 0),
      0,
    );

    const todosExtras = await this.extraRepository.find();
    const totalIngresosExtras = todosExtras
      .filter((e) => e.estadoPago === 'PAGADO')
      .reduce((sum, e) => sum + Number(e.precio || 0), 0);

    const totalIngresosHistorico =
      totalIngresosPagos + totalIngresosVentas + totalIngresosExtras;

    return {
      pensionadosActivos,
      pensionesActivas,
      consumosRegistrados,
      ventasCasuales,
      totalIngresosHistorico,
    };
  }

  private extraerFechaStr(f: any): string {
    if (!f) return '';
    if (f instanceof Date) {
      const year = f.getFullYear();
      const month = String(f.getMonth() + 1).padStart(2, '0');
      const day = String(f.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return String(f).slice(0, 10);
  }

  private getFechaLocalStr(d = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async cierreCaja(fechaStr?: string) {
    const fechaFiltroStr = fechaStr
      ? fechaStr.slice(0, 10)
      : this.getFechaLocalStr();

    const pagos = await this.pagoRepository.find({
      relations: { pension: { pensionado: true } },
    });
    const pagosHoy = pagos.filter((p) => {
      const f = this.extraerFechaStr(p.fechaPago);
      return f === fechaFiltroStr;
    });

    const ventas = await this.ventaRepository.find();
    const ventasHoy = ventas.filter((v) => {
      const f = this.extraerFechaStr(v.fecha);
      return f === fechaFiltroStr;
    });

    const extras = await this.extraRepository.find({
      relations: { pension: { pensionado: true } },
    });
    const extrasHoy = extras.filter((e) => {
      const f = this.extraerFechaStr(e.fecha);
      return f === fechaFiltroStr && e.estadoPago === 'PAGADO';
    });

    const consumos = await this.consumoRepository.find();
    const consumosHoy = consumos.filter((c) => {
      const f = this.extraerFechaStr(c.fecha);
      return f === fechaFiltroStr;
    });

    const totalPagos = pagosHoy.reduce(
      (sum, p) => sum + Number(p.montoTotal || 0),
      0,
    );
    const totalVentas = ventasHoy.reduce(
      (sum, v) => sum + Number(v.montoTotal || 0),
      0,
    );
    const totalExtras = extrasHoy.reduce(
      (sum, e) => sum + Number(e.precio || 0),
      0,
    );

    // Ganancia directa diaria (Casuales + Extras del día)
    const gananciaDirectaHoy = totalVentas + totalExtras;
    // Total recaudado en caja (incluye abonos de pensión)
    const totalIngresosHoy = gananciaDirectaHoy + totalPagos;

    // Desglose por método de pago (Efectivo y QR)
    let efectivo = 0;
    let qr = 0;

    pagosHoy.forEach((p) => {
      const m = (p.metodoPago || 'Efectivo').toLowerCase();
      const val = Number(p.montoTotal || 0);
      if (m.includes('qr')) qr += val;
      else efectivo += val;
    });

    ventasHoy.forEach((v) => {
      const m = (v.metodoPago || 'Efectivo').toLowerCase();
      const val = Number(v.montoTotal || 0);
      if (m.includes('qr')) qr += val;
      else efectivo += val;
    });

    extrasHoy.forEach((e) => {
      const m = (e.metodoPago || 'Efectivo').toLowerCase();
      const val = Number(e.precio || 0);
      if (m.includes('qr')) qr += val;
      else efectivo += val;
    });

    const totalPlatosCasuales = ventasHoy.reduce(
      (sum, v) => sum + Number(v.cantidadCompletos || 0),
      0,
    );
    const totalPlatosPensionados = consumosHoy.reduce(
      (sum, c) => sum + Number(c.cantidadCompletos || 0),
      0,
    );
    const totalComidasServidasHoy =
      totalPlatosPensionados + totalPlatosCasuales;

    return {
      fecha: fechaFiltroStr,
      gananciaDirectaHoy,
      totalIngresosHoy,
      totalPagos,
      totalVentas,
      totalExtras,
      totalComidasServidasHoy,
      totalPlatosPensionados,
      totalPlatosCasuales,
      desgloseMetodos: {
        efectivo,
        qr,
      },
      detalles: {
        pagos: pagosHoy,
        ventas: ventasHoy,
        extras: extrasHoy,
      },
    };
  }

  async historialGanancias(dias: number = 30, fechaInicio?: string, fechaFin?: string) {
    const [pagos, ventas, extras, consumos] = await Promise.all([
      this.pagoRepository.find(),
      this.ventaRepository.find(),
      this.extraRepository.find(),
      this.consumoRepository.find(),
    ]);

    const mapaDias = new Map<string, {
      fecha: string;
      totalVentas: number;
      cantidadCasuales: number;
      totalExtras: number;
      cantidadExtras: number;
      gananciaDirecta: number;
      totalPagosPension: number;
      totalCaja: number;
      platosPensionados: number;
      totalPlatosServidos: number;
    }>();

    const obtenerOCrearDia = (fechaStr: string) => {
      if (!mapaDias.has(fechaStr)) {
        mapaDias.set(fechaStr, {
          fecha: fechaStr,
          totalVentas: 0,
          cantidadCasuales: 0,
          totalExtras: 0,
          cantidadExtras: 0,
          gananciaDirecta: 0,
          totalPagosPension: 0,
          totalCaja: 0,
          platosPensionados: 0,
          totalPlatosServidos: 0,
        });
      }
      return mapaDias.get(fechaStr)!;
    };

    ventas.forEach((v) => {
      const f = this.extraerFechaStr(v.fecha);
      if (f) {
        const dia = obtenerOCrearDia(f);
        dia.totalVentas += Number(v.montoTotal || 0);
        dia.cantidadCasuales += Number(v.cantidadCompletos || 0);
      }
    });

    extras.forEach((e) => {
      if (e.estadoPago === 'PAGADO') {
        const f = this.extraerFechaStr(e.fecha);
        if (f) {
          const dia = obtenerOCrearDia(f);
          dia.totalExtras += Number(e.precio || 0);
          dia.cantidadExtras += 1;
        }
      }
    });

    pagos.forEach((p) => {
      const f = this.extraerFechaStr(p.fechaPago);
      if (f) {
        const dia = obtenerOCrearDia(f);
        dia.totalPagosPension += Number(p.montoTotal || 0);
      }
    });

    consumos.forEach((c) => {
      const f = this.extraerFechaStr(c.fecha);
      if (f) {
        const dia = obtenerOCrearDia(f);
        dia.platosPensionados += Number(c.cantidadCompletos || 0);
      }
    });

    // Calcular totales
    let resultado = Array.from(mapaDias.values()).map((dia) => {
      dia.gananciaDirecta = dia.totalVentas + dia.totalExtras;
      dia.totalCaja = dia.gananciaDirecta + dia.totalPagosPension;
      dia.totalPlatosServidos = dia.cantidadCasuales + dia.platosPensionados;
      return dia;
    });

    if (fechaInicio && fechaFin) {
      resultado = resultado.filter((d) => d.fecha >= fechaInicio && d.fecha <= fechaFin);
    }

    // Ordenar de más reciente a más antiguo
    return resultado.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, dias);
  }

  async ultimosConsumos() {
    return await this.consumoRepository.find({
      take: 8,
      order: {
        id: 'DESC',
      },
      relations: {
        pension: {
          pensionado: true,
        },
        opcionMenu: true,
      },
    });
  }

  async ultimosPagos() {
    return await this.pagoRepository.find({
      take: 8,
      order: {
        id: 'DESC',
      },
      relations: {
        pension: {
          pensionado: true,
        },
      },
    });
  }

  async alertas() {
    const pensiones = await this.pensionRepository.find({
      relations: {
        pensionado: true,
      },
      order: {
        completosDisponibles: 'ASC',
      },
    });

    return pensiones.filter(
      (p) =>
        p.completosDisponibles <= 5 &&
        (p.estado === 'ACTIVA' || p.estado === 'AGOTADA') &&
        p.pensionado &&
        p.pensionado.estado !== false,
    );
  }
}
