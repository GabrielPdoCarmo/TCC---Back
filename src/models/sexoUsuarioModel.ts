import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'Sexos_Usuario',
  timestamps: false,
})
export class Sexo_Usuario extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  descricao!: string;
}
