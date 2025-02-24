import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Especie } from "./Especie";

@Table({
  tableName: "Racas",
  timestamps: false,
})
export class Raca extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  nome!: string;

  @ForeignKey(() => Especie)
  @Column({ type: DataType.INTEGER, allowNull: false })
  especie_id!: number;

  @BelongsTo(() => Especie)
  especie!: Especie;
}
