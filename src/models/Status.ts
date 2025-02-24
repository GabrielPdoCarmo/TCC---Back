import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "status",
  timestamps: false,
})
export class Status extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  nome!: string;
}
