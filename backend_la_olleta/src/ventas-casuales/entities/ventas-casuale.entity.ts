import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('ventas_casuales')
export class VentasCasuale {
     @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column('date', {
    name: 'fecha',
  })
  fecha!: Date;

  @Column('integer', {
    name: 'cantidad_completos',
  })
  cantidadCompletos!: number;

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

  @CreateDateColumn({
    name: 'fecha_creacion',
  })
  fechaCreacion!: Date;

}
