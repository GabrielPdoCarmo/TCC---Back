import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "faixas_etarias",
  timestamps: false,
})
export class FaixaEtaria extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false })
  nome!: string;

  @Column({ type: DataType.INTEGER })
  idade_max!: number;

  @Column({ type: DataType.INTEGER })
  idade_min!: number;
}
