import { Consumo } from "src/consumos/entities/consumo.entity";
import { Menu } from "src/menus/entities/menu.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('opciones_menu')
export class OpcionesMenu {
    @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column('varchar', {
    name: 'nombre_segundo',
    length: 150,
  })
  nombreSegundo!: string;

   @OneToMany(
  () => Consumo,
  (consumo) => consumo.opcionMenu,
)
consumos!: Consumo[];

   @ManyToOne(
    () => Menu,
    (menu) => menu.opcionesMenu,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )

  @JoinColumn({
    name: 'id_menu',
  })
  menu!: Menu;
}
