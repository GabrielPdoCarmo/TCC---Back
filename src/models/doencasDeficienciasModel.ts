import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { PetDoencaDeficiencia } from './petDoencaDeficienciaModel';

@Table({
  tableName: 'Doencas_deficiencias',
  timestamps: false,
})
export class DoencasDeficiencias extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  nome!: string;

}
