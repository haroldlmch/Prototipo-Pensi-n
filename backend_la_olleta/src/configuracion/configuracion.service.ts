import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateConfiguracionDto } from './dto/create-configuracion.dto';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { Configuracion } from './entities/configuracion.entity';

@Injectable()
export class ConfiguracionService {
  constructor(
    @InjectRepository(Configuracion)
    private readonly configuracionRepository: Repository<Configuracion>,
  ) {}

  async create(createConfiguracionDto: CreateConfiguracionDto) {
    const configuracion = this.configuracionRepository.create(
      createConfiguracionDto,
    );

    return await this.configuracionRepository.save(configuracion);
  }

  async findAll() {
    const configuracion = await this.configuracionRepository.findOne({
      where: {},
      order: {
        id: 'ASC',
      },
    });

    if (configuracion) return configuracion;

    return await this.create({
      precioPensionado: 15,
      precioCasual: 18,
      precioExtra: 20,
      saldoBajoAlerta: 5,
    });
  }

  async findOne(id: number) {
    const configuracion = await this.configuracionRepository.findOne({
      where: { id },
    });

    if (!configuracion) {
      throw new NotFoundException('Configuración no encontrada');
    }

    return configuracion;
  }

  async update(id: number, updateConfiguracionDto: UpdateConfiguracionDto) {
    const configuracion = await this.findOne(id);

    Object.assign(configuracion, updateConfiguracionDto);

    return await this.configuracionRepository.save(configuracion);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.configuracionRepository.delete(id);

    return {
      mensaje: 'Configuración eliminada',
    };
  }
}
