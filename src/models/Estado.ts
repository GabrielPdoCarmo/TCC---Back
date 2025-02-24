import { Table, Column, Model, DataType} from "sequelize-typescript";

@Table({
  tableName: "Estados",
  timestamps: false,
})
export class Estado extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  nome!: string;
}
