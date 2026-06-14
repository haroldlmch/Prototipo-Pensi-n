import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Pensionado } from './entities/pensionado.entity';

import { CreatePensionadoDto } from './dto/create-pensionado.dto';
import { UpdatePensionadoDto } from './dto/update-pensionado.dto';

@Injectable()
export class PensionadosService {

constructor(
@InjectRepository(Pensionado)
private readonly pensionadoRepository: Repository<Pensionado>,
) {}

async create(
createPensionadoDto: CreatePensionadoDto,
) {
const pensionado =
this.pensionadoRepository.create(
createPensionadoDto,
);


return await this.pensionadoRepository.save(
  pensionado,
);

}

async findAll() {
return await this.pensionadoRepository.find({
order: {
id: 'DESC',
},
});
}

async findOne(id: number) {


const pensionado =
  await this.pensionadoRepository.findOne({
    where: { id },
  });

if (!pensionado) {
  throw new NotFoundException(
    'Pensionado no encontrado',
  );
}

return pensionado;

}

async update(
id: number,
updatePensionadoDto: UpdatePensionadoDto,
) {


const pensionado =
  await this.findOne(id);

Object.assign(
  pensionado,
  updatePensionadoDto,
);

return await this.pensionadoRepository.save(
  pensionado,
);

}

async remove(id: number) {


await this.findOne(id);

await this.pensionadoRepository.softDelete(
  id,
);

return {
  mensaje: 'Pensionado eliminado',
};

}
}

