import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen')
  resumen() {
    return this.dashboardService.resumen();
  }

  @Get('ultimos-consumos')
  ultimosConsumos() {
    return this.dashboardService.ultimosConsumos();
  }

  @Get('ultimos-pagos')
  ultimosPagos() {
    return this.dashboardService.ultimosPagos();
  }

  @Get('alertas')
  alertas() {
    return this.dashboardService.alertas();
  }

  @Get('cierre-caja')
  cierreCaja(@Query('fecha') fecha?: string) {
    return this.dashboardService.cierreCaja(fecha);
  }

  @Get('historial-ganancias')
  historialGanancias(
    @Query('dias') dias?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.dashboardService.historialGanancias(
      dias ? parseInt(dias, 10) : 60,
      fechaInicio,
      fechaFin,
    );
  }

  @Get('estadisticas-platos')
  estadisticasPlatos() {
    return this.dashboardService.estadisticasPlatos();
  }
}

