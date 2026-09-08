import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Pensione } from './entities/pensione.entity';
import { Pensionado } from '../pensionados/entities/pensionado.entity';

import { CreatePensioneDto } from './dto/create-pensione.dto';
import { UpdatePensioneDto } from './dto/update-pensione.dto';

@Injectable()
export class PensionesService {

constructor(
@InjectRepository(Pensione)
private readonly pensioneRepository: Repository<Pensione>,


@InjectRepository(Pensionado)
private readonly pensionadoRepository: Repository<Pensionado>,


) {}

  async create(createPensioneDto: CreatePensioneDto) {
    const pensionado = await this.pensionadoRepository.findOne({
      where: {
        id: createPensioneDto.idPensionado,
      },
    });

    if (!pensionado) {
      throw new NotFoundException('Pensionado no encontrado');
    }

    // 1. Buscar si el pensionado ya cuenta con una pensión registrada en el sistema
    let pensionExistente: Pensione | null = null;
    if (createPensioneDto.idPensionAnterior) {
      pensionExistente = await this.pensioneRepository.findOne({
        where: { id: createPensioneDto.idPensionAnterior },
        relations: { pensionado: true },
      });
    }

    if (!pensionExistente) {
      pensionExistente = await this.pensioneRepository.findOne({
        where: { pensionado: { id: pensionado.id } },
        relations: { pensionado: true },
        order: { id: 'DESC' },
      });
    }

    // 2. Si ya existe, renovar/actualizar la pensión existente para mantener un único registro activo por cliente
    if (pensionExistente) {
      pensionExistente.fechaInicio = createPensioneDto.fechaInicio.slice(0, 10) as any;
      pensionExistente.cantidadCompletos = createPensioneDto.cantidadCompletos;
      pensionExistente.completosDisponibles = createPensioneDto.completosDisponibles;
      pensionExistente.estado = 'ACTIVA';
      pensionExistente.pensionado = pensionado;

      return await this.pensioneRepository.save(pensionExistente);
    }

    // 3. Si es la primera vez que se registra una pensión para este cliente, crearla
    const pension = this.pensioneRepository.create({
      fechaInicio: createPensioneDto.fechaInicio.slice(0, 10) as any,
      cantidadCompletos: createPensioneDto.cantidadCompletos,
      completosDisponibles: createPensioneDto.completosDisponibles,
      estado: createPensioneDto.estado || 'ACTIVA',
      pensionado,
    });

    return await this.pensioneRepository.save(pension);
  }

  async findAll() {
    const all = await this.pensioneRepository.find({
      relations: {
        pensionado: true,
      },
      order: {
        id: 'DESC',
      },
    });

    // Garantizar que solo se liste un único registro de pensión por cada cliente
    const vistos = new Set<number>();
    const unicasPorPensionado: Pensione[] = [];

    for (const p of all) {
      if (!p.pensionado) continue;
      if (!vistos.has(p.pensionado.id)) {
        vistos.add(p.pensionado.id);
        unicasPorPensionado.push(p);
      }
    }

    return unicasPorPensionado;
  }

async findOne(id: number) {


const pension =
  await this.pensioneRepository.findOne({
    where: { id },
    relations: {
      pensionado: true,
      pagos: true,
      consumos: true,
      extras: true,
    },
  });

if (!pension) {
  throw new NotFoundException(
    'Pensión no encontrada',
  );
}

return pension;


}

async update(
  id: number,
  updatePensioneDto: UpdatePensioneDto,
) {

  const pension =
    await this.findOne(id);

  if (
  updatePensioneDto.fechaInicio
) {
  pension.fechaInicio =
    updatePensioneDto.fechaInicio.slice(0, 10) as any;
}

  if (
    updatePensioneDto.cantidadCompletos !==
    undefined
  ) {
    pension.cantidadCompletos =
      updatePensioneDto.cantidadCompletos;
  }

  if (
    updatePensioneDto.completosDisponibles !==
    undefined
  ) {
    pension.completosDisponibles =
      updatePensioneDto.completosDisponibles;
  }

  if (
    updatePensioneDto.estado
  ) {
    pension.estado =
      updatePensioneDto.estado;
  }

  if (
    updatePensioneDto.idPensionado
  ) {

    const pensionado =
      await this.pensionadoRepository.findOne({
        where: {
          id:
            updatePensioneDto.idPensionado,
        },
      });

    if (!pensionado) {
      throw new NotFoundException(
        'Pensionado no encontrado',
      );
    }

    pension.pensionado =
      pensionado;
  }

  return await this.pensioneRepository.save(
    pension,
  );
}

async remove(id: number) {


await this.findOne(id);

await this.pensioneRepository.softDelete(
  id,
);

return {
  mensaje: 'Pensión eliminada',
};


}
}

