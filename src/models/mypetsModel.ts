import { Table, Column, Model, ForeignKey, DataType, BelongsTo } from 'sequelize-typescript';
import { Pet } from './petModel';
import { Usuario } from './usuarioModel';

@Table({
  tableName: 'MyPets',
  timestamps: false,
})
export class MyPets extends Model {
  @ForeignKey(() => Pet)
  @Column({ primaryKey: true, type: DataType.INTEGER, allowNull: false })
  pet_id!: number;

  @ForeignKey(() => Usuario)
  @Column({ primaryKey: true, type: DataType.INTEGER, allowNull: false })
  usuaria_id!: number;

  // 🔧 Associações
  @BelongsTo(() => Pet)
  pet!: Pet;

  @BelongsTo(() => Usuario)
  usuario!: Usuario;
}
