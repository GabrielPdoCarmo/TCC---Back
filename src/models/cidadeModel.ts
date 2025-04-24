import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Estado } from './estadoModel';

@Table({ tableName: 'Cidades', timestamps: false })
export class Cidade extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  nome!: string;

  @ForeignKey(() => Estado)
  @Column({ type: DataType.INTEGER })
  estado_id!: number;

  @BelongsTo(() => Estado)
  estado?: Estado;
}

export default Cidade;
