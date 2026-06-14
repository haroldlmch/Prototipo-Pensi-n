import { Module } from '@nestjs/common';
import { ExtrasService } from './extras.service';
import { ExtrasController } from './extras.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Extra } from './entities/extra.entity';
import { Pensione } from 'src/pensiones/entities/pensione.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Extra, Pensione])],
  controllers: [ExtrasController],
  providers: [ExtrasService],
})
export class ExtrasModule {}
