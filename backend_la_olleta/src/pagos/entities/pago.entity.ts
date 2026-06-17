import { Pensione } from "src/pensiones/entities/pensione.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('pagos')
export class Pago {
     @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column('date', {
    name: 'fecha_pago',
  })
  fechaPago!: Date;

  @Column('decimal', {
    name: 'precio_unitario',
    precision: 10,
    scale: 2,
  })
  precioUnitario!: number;

  @Column('decimal', {
    name: 'monto_total',
    precision: 10,
    scale: 2,
  })
  montoTotal!: number;

  @ManyToOne(
    () => Pensione,
    (pension) => pension.pagos,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'id_pension',
  })
  pension!: Pensione;

  @CreateDateColumn({
    name: 'fecha_creacion',
  })
  fechaCreacion!: Date;

  @UpdateDateColumn({
    name: 'fecha_actualizacion',
  })
  fechaActualizacion!: Date;
}
