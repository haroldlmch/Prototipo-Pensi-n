import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Extra } from './entities/extra.entity';
import { Pensione } from '../pensiones/entities/pensione.entity';

import { CreateExtraDto } from './dto/create-extra.dto';
import { UpdateExtraDto } from './dto/update-extra.dto';

@Injectable()
export class ExtrasService {
  constructor(
    @InjectRepository(Extra)
    private readonly extraRepository: Repository<Extra>,

    @InjectRepository(Pensione)
    private readonly pensionRepository: Repository<Pensione>,
  ) {}

  async create(createExtraDto: CreateExtraDto) {
    let pension: Pensione | null = null;
    let tipoCliente = createExtraDto.tipoCliente || 'PENSIONADO';
    let clienteCasual = createExtraDto.clienteCasual || null;
    let estadoPago = createExtraDto.estadoPago || 'PENDIENTE';
    const metodoPago = createExtraDto.metodoPago || 'Efectivo';

    if (createExtraDto.idPension) {
      pension = await this.pensionRepository.findOne({
        where: {
          id: createExtraDto.idPension,
        },
      });

      if (!pension) {
        throw new NotFoundException('Pensión no encontrada');
      }
      tipoCliente = 'PENSIONADO';
      clienteCasual = null;
    } else {
      tipoCliente = 'CASUAL';
      if (!clienteCasual) {
        clienteCasual = 'Cliente Casual';
      }
      // Por defecto para clientes casuales suele ser PAGADO si no se indica lo contrario
      if (!createExtraDto.estadoPago) {
        estadoPago = 'PAGADO';
      }
    }

    const extra = this.extraRepository.create({
      fecha: createExtraDto.fecha.slice(0, 10) as any,
      descripcion: createExtraDto.descripcion,
      precio: createExtraDto.precio,
      estadoPago,
      tipoCliente,
      clienteCasual: clienteCasual || undefined,
      metodoPago,
      pension,
    });

    return await this.extraRepository.save(extra);
  }

  async findAll() {
    return await this.extraRepository.find({
      relations: {
        pension: {
          pensionado: true,
        },
      },
      order: {
        id: 'DESC',
      },
    });
  }

  async findOne(id: number) {
    const extra = await this.extraRepository.findOne({
      where: { id },
      relations: {
        pension: {
          pensionado: true,
        },
      },
    });

    if (!extra) {
      throw new NotFoundException('Extra no encontrado');
    }

    return extra;
  }

  async update(id: number, updateExtraDto: UpdateExtraDto) {
    const extra = await this.findOne(id);

    if (updateExtraDto.fecha) {
      extra.fecha = updateExtraDto.fecha.slice(0, 10) as any;
    }

    if (updateExtraDto.descripcion) {
      extra.descripcion = updateExtraDto.descripcion;
    }

    if (updateExtraDto.precio !== undefined) {
      extra.precio = updateExtraDto.precio;
    }

    if (updateExtraDto.tipoCliente) {
      extra.tipoCliente = updateExtraDto.tipoCliente;
    }

    if (updateExtraDto.clienteCasual !== undefined) {
      extra.clienteCasual = updateExtraDto.clienteCasual;
    }

    if (updateExtraDto.metodoPago !== undefined) {
      extra.metodoPago = updateExtraDto.metodoPago;
    }

    if (updateExtraDto.idPension !== undefined) {
      if (updateExtraDto.idPension) {
        const pension = await this.pensionRepository.findOne({
          where: {
            id: updateExtraDto.idPension,
          },
        });

        if (!pension) {
          throw new NotFoundException('Pensión no encontrada');
        }

        extra.pension = pension;
        extra.tipoCliente = 'PENSIONADO';
      } else {
        extra.pension = null;
        extra.tipoCliente = 'CASUAL';
      }
    }

    if (updateExtraDto.estadoPago) {
      extra.estadoPago = updateExtraDto.estadoPago;
    }

    return await this.extraRepository.save(extra);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.extraRepository.delete(id);
    return {
      mensaje: 'Extra eliminado',
    };
  }
}

