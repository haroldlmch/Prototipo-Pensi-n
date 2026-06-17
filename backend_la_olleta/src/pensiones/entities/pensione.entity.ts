import { Consumo } from "src/consumos/entities/consumo.entity";
import { Extra } from "src/extras/entities/extra.entity";
import { Pago } from "src/pagos/entities/pago.entity";
import { Pensionado } from "src/pensionados/entities/pensionado.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('pensiones')
export class Pensione {
    @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column('date', {
    name: 'fecha_inicio',
  })
  fechaInicio!: Date;

  @Column('integer', {
    name: 'cantidad_completos',
  })
  cantidadCompletos!: number;

  @Column('integer', {
    name: 'completos_disponibles',
  })
  completosDisponibles!: number;

  @Column('varchar', {
    name: 'estado',
    length: 30,
  })
  estado!: string;

  @ManyToOne(
    () => Pensionado,
    (pensionado) => pensionado.pensiones,
    {
      nullable: false,
      onDelete: 'RESTRICT',
    },
  )
   @JoinColumn({
    name: 'id_pensionado',
  })
  pensionado!: Pensionado;

  @OneToMany(
  () => Pago,
  (pago) => pago.pension,
)
pagos!: Pago[];

@OneToMany(
  () => Consumo,
  (consumo) => consumo.pension,
)
consumos!: Consumo[];

@OneToMany(
    () => Extra,
    (extra) => extra.pension,
  )
  extras!: Extra[];



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
