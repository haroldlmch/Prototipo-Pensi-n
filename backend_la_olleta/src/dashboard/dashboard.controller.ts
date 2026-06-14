import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {

  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

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
}
