import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import Estado from "./estadoModel";

@Table({
  tableName: "Cidades",
  timestamps: false,
})
export class Cidade extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  nome!: string;

  @ForeignKey(() => Estado)
  @Column({ type: DataType.INTEGER, allowNull: false })
  estadoId!: number;

  @BelongsTo(() => Estado)
  estado!: Estado;
}

export default Cidade;