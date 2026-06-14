import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsuariosService } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    nombreUsuario: string,
    contrasena: string,
  ) {

    const usuario =
      await this.usuariosService.findByNombreUsuario(
        nombreUsuario,
      );

    if (!usuario) {
      throw new UnauthorizedException(
        'Usuario o contraseña incorrectos',
      );
    }

    if (usuario.contrasena !== contrasena) {
      throw new UnauthorizedException(
        'Usuario o contraseña incorrectos',
      );
    }

    const payload = {
      sub: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuario.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
