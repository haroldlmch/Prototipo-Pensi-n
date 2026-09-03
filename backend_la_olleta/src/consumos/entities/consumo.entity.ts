import { OpcionesMenu } from "src/opciones-menu/entities/opciones-menu.entity";
import { Pensione } from "src/pensiones/entities/pensione.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('consumos')
export class Consumo {
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

  @Column('varchar', {
    name: 'tipo_consumo',
    length: 30,
  })
  tipoConsumo!: string;

  @Column('varchar', {
    name: 'tipo_plato',
    length: 30,
    nullable: true,
    default: 'Completo',
  })
  tipoPlato?: string;

  @Column('varchar', {
    name: 'estado_entrega',
    length: 30,
    nullable: true,
    default: 'ENTREGADO',
  })
  estadoEntrega?: string;

  @ManyToOne(
    () => Pensione,
    (pension) => pension.consumos,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'id_pension',
  })
  pension!: Pensione;

  @ManyToOne(
    () => OpcionesMenu,
    (opcionMenu) => opcionMenu.consumos,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'id_opcion_menu',
  })
  opcionMenu?: OpcionesMenu;

  @CreateDateColumn({
    name: 'fecha_creacion',
  })
  fechaCreacion!: Date;
}
