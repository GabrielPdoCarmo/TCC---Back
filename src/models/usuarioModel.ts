import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Cidade } from './cidadeModel';
import { Sexo_Usuario } from './sexoUsuarioModel';
import Estado from './estadoModel';

@Table({
  tableName: 'Usuario',
  timestamps: false,
})
export class Usuario extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false })
  nome!: string;

  @ForeignKey(() => Sexo_Usuario)
  @Column({ type: DataType.INTEGER, allowNull: false })
  sexo_id!: string;

  @Column({ type: DataType.STRING(9), allowNull: false })
  telefone!: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  senha!: string;

  @Column({ type: DataType.STRING(14), allowNull: false, unique: true })
  cpf!: string;

  @Column({ type: DataType.STRING(10), allowNull: true })
  cep!: string;

  @ForeignKey(() => Estado)
  @Column({ type: DataType.INTEGER, allowNull: false })
  estado_id!: number;

  @ForeignKey(() => Cidade)
  @Column({ type: DataType.INTEGER, allowNull: false })
  cidade_id!: number;

  @BelongsTo(() => Cidade)
  cidade!: Cidade;
  @BelongsTo(() => Estado)
  estado!: Estado;

  @BelongsTo(() => Sexo_Usuario)
  sexo!: Sexo_Usuario;
}
