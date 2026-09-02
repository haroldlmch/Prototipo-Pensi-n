import { Pensione } from 'src/pensiones/entities/pensione.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @Column('varchar', {
    name: 'estado_pago',
    length: 30,
    default: 'PENDIENTE',
  })
  estadoPago!: string;

  @Column('varchar', {
    name: 'tipo_cliente',
    length: 30,
    default: 'PENSIONADO',
  })
  tipoCliente!: string;

  @Column('varchar', {
    name: 'cliente_casual',
    length: 150,
    nullable: true,
  })
  clienteCasual?: string;

  @Column('varchar', {
    name: 'metodo_pago',
    length: 30,
    nullable: true,
    default: 'Efectivo',
  })
  metodoPago?: string;

  @ManyToOne(() => Pensione, (pension) => pension.extras, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_pension',
  })
  pension?: Pensione | null;

  @CreateDateColumn({
    name: 'fecha_creacion',
  })
  fechaCreacion!: Date;
}
