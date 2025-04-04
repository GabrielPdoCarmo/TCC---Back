import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Pet } from './petModel';
import { Usuario } from './usuarioModel';

@Table({
  tableName: 'Favoritos',
  timestamps: true, // Para registrar data de criação e atualização
})
export class Favorito extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @ForeignKey(() => Usuario)
  @Column({ type: DataType.INTEGER, allowNull: false })
  usuario_id!: number;

  @ForeignKey(() => Pet)
  @Column({ type: DataType.INTEGER, allowNull: false })
  pet_id!: number;

  @BelongsTo(() => Usuario)
  usuario!: Usuario;

  @BelongsTo(() => Pet)
  pet!: Pet;
}
