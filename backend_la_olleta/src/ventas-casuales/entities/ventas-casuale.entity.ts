import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { OpcionesMenu } from "src/opciones-menu/entities/opciones-menu.entity";

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

  @Column('varchar', {
    name: 'metodo_pago',
    length: 50,
    default: 'Efectivo',
  })
  metodoPago!: string;

  @ManyToOne(
    () => OpcionesMenu,
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
