import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Cidade } from "./cidadeModel";

@Table({
  tableName: "Usuario",
  timestamps: false,
})
export class Usuario extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  nome!: string;

  @Column({ type: DataType.STRING(100), allowNull: false })
  sexo!: string;

  @Column({ type: DataType.STRING(9), allowNull: false })
  telefone!: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING(12), allowNull: false })
  senha!: string;

  @Column({ type: DataType.STRING(14), allowNull: false, unique: true })
  cpf!: string;

  @Column({ type: DataType.STRING(10), allowNull: true })
  cep!: string;

  @ForeignKey(() => Cidade)
  @Column({ type: DataType.INTEGER, allowNull: false })
  cidadeId!: number;

  @BelongsTo(() => Cidade)
  cidade!: Cidade;
}
