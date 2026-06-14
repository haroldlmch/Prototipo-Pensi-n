import { OpcionesMenu } from "src/opciones-menu/entities/opciones-menu.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('menus')
export class Menu {
    @PrimaryGeneratedColumn('identity')
  id!: number;

  @Column('date', {
    name: 'fecha',
    unique: true,
  })
  fecha!: Date;

  @Column('varchar', {
    name: 'sopa',
    length: 150,
  })
  sopa!: string;

  @CreateDateColumn({
    name: 'fecha_creacion',
  })
  fechaCreacion!: Date;

  @UpdateDateColumn({
    name: 'fecha_actualizacion',
  })
  fechaActualizacion!: Date;

  @OneToMany(
  () => OpcionesMenu,
  (opcionMenu) => opcionMenu.menu,
)
opcionesMenu!: OpcionesMenu[];
}
