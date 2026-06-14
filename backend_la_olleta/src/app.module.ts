import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PensionadosModule } from './pensionados/pensionados.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { MenusModule } from './menus/menus.module';
import { OpcionesMenuModule } from './opciones-menu/opciones-menu.module';
import { PensionesModule } from './pensiones/pensiones.module';
import { PagosModule } from './pagos/pagos.module';
import { ConsumosModule } from './consumos/consumos.module';
import { ExtrasModule } from './extras/extras.module';
import { VentasCasualesModule } from './ventas-casuales/ventas-casuales.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
  isGlobal: true,
}),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      autoLoadEntities: true,
    }),
    UsuariosModule,
    PensionadosModule,
    ConfiguracionModule,
    MenusModule,
    OpcionesMenuModule,
    PensionesModule,
    PagosModule,
    ConsumosModule,
    ExtrasModule,
    VentasCasualesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
