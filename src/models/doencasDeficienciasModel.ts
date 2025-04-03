import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Pet } from "./petModel";

@Table({
  tableName: "Doencas_deficiencias",
  timestamps: false,
})
export class DoencasDeficiencias extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @ForeignKey(() => Pet)
  @Column({ type: DataType.INTEGER, allowNull: false })
  pet_id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  nome!: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  possui!: boolean;

  @BelongsTo(() => Pet)
  pet!: Pet;
}
