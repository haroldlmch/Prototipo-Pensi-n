import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('usuarios')
export class Usuario {

  @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column('varchar', {
    name: 'nombre_usuario',
    length: 50,
    unique: true,
  })
  nombreUsuario!: string;

  @Column('varchar', {
    name: 'contrasena',
    length: 255,
  })
  contrasena!: string;

  @Column('varchar', {
    name: 'rol',
    length: 30,
  })
  rol!: string;

  @Column('boolean', {
    name: 'estado',
    default: true,
  })
  estado!: boolean;

  @CreateDateColumn({
    name: 'fecha_creacion',
  })
  fechaCreacion!: Date;

  @UpdateDateColumn({
    name: 'fecha_actualizacion',
  })
  fechaActualizacion!: Date;

  @DeleteDateColumn({
    name: 'fecha_eliminacion',
  })
  fechaEliminacion!: Date;
}