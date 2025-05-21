import { Table, Column, Model, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt } from "sequelize-typescript";
import { Usuario } from "./usuarioModel";

@Table({
  tableName: "recuperacao_senha",
  timestamps: true,
})
export class RecuperacaoSenha extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @ForeignKey(() => Usuario)
  @Column({ type: DataType.INTEGER, allowNull: false })
  usuario_id!: number;

  @BelongsTo(() => Usuario)
  usuario!: Usuario;

  @Column({ type: DataType.STRING, allowNull: false })
  email!: string;

  @Column({ type: DataType.STRING(6), allowNull: false })
  codigo!: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  expirado!: boolean;

  @Column({ type: DataType.DATE, allowNull: false })
  expiracao!: Date;
}