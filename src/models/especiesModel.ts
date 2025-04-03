import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "Especies",
  timestamps: false,
})
export class Especie extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  nome!: string;
}
