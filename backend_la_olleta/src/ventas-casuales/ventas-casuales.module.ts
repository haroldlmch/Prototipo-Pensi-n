import { Module } from '@nestjs/common';
import { VentasCasualesService } from './ventas-casuales.service';
import { VentasCasualesController } from './ventas-casuales.controller';
import { VentasCasuale } from './entities/ventas-casuale.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([VentasCasuale])],
  controllers: [VentasCasualesController],
  providers: [VentasCasualesService],
})
export class VentasCasualesModule {}
