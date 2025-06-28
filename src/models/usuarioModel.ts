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

  @Column({ type: DataType.STRING(15), allowNull: false, unique: true })
  telefone!: string;

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  senha!: string;

  // Campo para CPF ou CNPJ (18 caracteres para comportar CNPJ com máscara)
  @Column({ type: DataType.STRING(18), allowNull: false, unique: true })
  documento!: string;

  // Campo para identificar o tipo de documento
  @Column({ 
    type: DataType.ENUM('CPF', 'CNPJ'), 
    allowNull: false,
    defaultValue: 'CPF'
  })
  tipo_documento!: 'CPF' | 'CNPJ';

  @Column({ type: DataType.STRING(10), allowNull: true })
  cep!: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  foto!: string; // nova coluna para armazenar URL da imagem

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