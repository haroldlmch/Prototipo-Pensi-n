import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Usuario } from './entities/usuario.entity';

import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async findByNombreUsuario(
    nombreUsuario: string,
  ): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: {
        nombreUsuario,
      },
    });
  }

  create(createUsuarioDto: CreateUsuarioDto) {
    return 'create usuario';
  }

  findAll() {
    return [];
  }

  findOne(id: number) {
    return null;
  }

  update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return null;
  }

  remove(id: number) {
    return null;
  }
}
