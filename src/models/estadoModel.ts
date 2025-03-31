import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({ tableName: "Estados", timestamps: false }) // Aqui está a correção
export class Estado extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  nome!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  sigla!: string;
}

export default Estado;
