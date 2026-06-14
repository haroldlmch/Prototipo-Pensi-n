import { Pensione } from "src/pensiones/entities/pensione.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('extras')
export class Extra {
    @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column('date', {
    name: 'fecha',
  })
  fecha!: Date;

  @Column('varchar', {
    name: 'descripcion',
    length: 200,
  })
  descripcion!: string;

  @Column('decimal', {
    name: 'precio',
    precision: 10,
    scale: 2,
  })
  precio!: number;

  @ManyToOne(
    () => Pensione,
    (pension) => pension.extras,
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
}
