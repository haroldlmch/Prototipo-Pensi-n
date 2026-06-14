import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('configuracion')
export class Configuracion {
    @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column('decimal', {
    name: 'precio_pensionado',
    precision: 10,
    scale: 2,
    default: 15.00,
  })
  precioPensionado!: number;

  @Column('decimal', {
    name: 'precio_casual',
    precision: 10,
    scale: 2,
    default: 18.00,
  })
  precioCasual!: number;

  @Column('decimal', {
    name: 'precio_extra',
    precision: 10,
    scale: 2,
    default: 20.00,
  })
  precioExtra!: number;

  @Column('integer', {
    name: 'saldo_bajo_alerta',
    default: 5,
  })
  saldoBajoAlerta!: number;

  @CreateDateColumn({
    name: 'fecha_creacion',
  })
  fechaCreacion!: Date;

  @UpdateDateColumn({
    name: 'fecha_actualizacion',
  })
  fechaActualizacion!: Date;
}
