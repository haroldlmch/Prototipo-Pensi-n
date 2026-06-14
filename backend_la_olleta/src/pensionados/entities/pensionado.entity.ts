import { Pensione } from "src/pensiones/entities/pensione.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('pensionados')
export class Pensionado {
    @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column('varchar', {
    name: 'nombre_completo',
    length: 150,
  })
  nombreCompleto!: string;

  @Column('varchar', {
    name: 'telefono',
    length: 20,
    nullable: true,
  })
  telefono!: string;

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

  @OneToMany(
  () => Pensione,
  (pension) => pension.pensionado,
)
pensiones!: Pensione[];
}
