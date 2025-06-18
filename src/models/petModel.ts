import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript';
import { Especie } from './especiesModel';
import { Raca } from './racaModel';
import { FaixaEtaria } from './faixaEtariaModel';
import { Usuario } from './usuarioModel';
import { Estado } from './estadoModel'; // importe o model Estado
import { Status } from './statusModel';
import { Cidade } from './cidadeModel';
import { Sexo } from './sexoPetModel';
import { DoencasDeficiencias } from './doencasDeficienciasModel';
import { PetDoencaDeficiencia } from './petDoencaDeficienciaModel';

@Table({
  tableName: 'Pets',
  timestamps: false,
})
export class Pet extends Model {
  @BelongsToMany(() => DoencasDeficiencias, () => PetDoencaDeficiencia)
  doencasDeficiencias!: DoencasDeficiencias[];
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @ForeignKey(() => Especie)
  @Column({ type: DataType.INTEGER, allowNull: false })
  especie_id!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  nome!: string;

  @ForeignKey(() => Raca)
  @Column({ type: DataType.INTEGER, allowNull: false })
  raca_id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  idade!: number;

  @ForeignKey(() => FaixaEtaria)
  @Column({ type: DataType.INTEGER, allowNull: false })
  faixa_etaria_id!: number;

  @ForeignKey(() => Usuario)
  @Column({ type: DataType.INTEGER, allowNull: false })
  usuario_id!: number;

  @ForeignKey(() => Usuario)
  @Column({ type: DataType.INTEGER, allowNull: false })
  doador_id!: number;

  @ForeignKey(() => Usuario)
  @Column({ type: DataType.INTEGER, allowNull: true })
  adotante_id!: number;

  @ForeignKey(() => Sexo)
  @Column({ type: DataType.INTEGER, allowNull: false })
  sexo_id!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  motivoDoacao!: string;

  @Column({ type: DataType.STRING(15), allowNull: true, unique: true })
  rg_Pet!: number;

  @ForeignKey(() => Status)
  @Column({ type: DataType.INTEGER, allowNull: false })
  status_id!: number;

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

  @BelongsTo(() => Especie)
  especie!: Especie;

  @BelongsTo(() => Raca)
  raca!: Raca;

  @BelongsTo(() => Estado)
  estado!: Estado;

  @BelongsTo(() => Usuario, { foreignKey: 'usuario_id', as: 'responsavel' })
  responsavel!: Usuario;

  /**
   * Doador original do pet (nunca muda)
   * Sempre aponta para quem primeiro cadastrou o pet
   */
  @BelongsTo(() => Usuario, { foreignKey: 'doador_id', as: 'doador' })
  doador!: Usuario;

  /**
   * Adotante atual do pet (null se não foi adotado)
   * Preenchido quando o pet é adotado
   */
  @BelongsTo(() => Usuario, { foreignKey: 'adotante_id', as: 'adotante' })
  adotante!: Usuario;

  @BelongsTo(() => FaixaEtaria)
  faixaEtaria!: FaixaEtaria;

  @BelongsTo(() => Status)
  status!: Status;
  @BelongsTo(() => Sexo)
  sexo!: Sexo;
}
